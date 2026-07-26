import http from 'node:http'
import { spawn } from 'node:child_process'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

const port = Number(process.env.PORT || 8081)
const timeoutMs = Number(process.env.EXECUTION_TIMEOUT_MS || 5000)
const maxOutputBytes = Number(process.env.MAX_OUTPUT_BYTES || 32768)
const maxBodyBytes = 512 * 1024
const resultMarker = '__TRACEROUND_RESULT__'
const detailMarker = '__TRACEROUND_DETAIL__'

function runProcess(command, args, cwd) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd,
      env: { PATH: process.env.PATH, HOME: '/tmp' },
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let stdout = ''
    let stderr = ''
    let outputBytes = 0
    let timedOut = false

    const collect = (target) => (chunk) => {
      if (outputBytes >= maxOutputBytes) return
      const remaining = maxOutputBytes - outputBytes
      const text = chunk.subarray(0, remaining).toString()
      outputBytes += Buffer.byteLength(text)
      if (target === 'stdout') stdout += text
      else stderr += text
    }

    child.stdout.on('data', collect('stdout'))
    child.stderr.on('data', collect('stderr'))

    const timer = setTimeout(() => {
      timedOut = true
      child.kill('SIGKILL')
    }, timeoutMs)

    child.on('error', (error) => {
      clearTimeout(timer)
      resolve({ exitCode: -1, stdout, stderr: `${stderr}${error.message}`, timedOut })
    })
    child.on('close', (exitCode) => {
      clearTimeout(timer)
      resolve({ exitCode: exitCode === null ? -1 : exitCode, stdout, stderr, timedOut })
    })
  })
}

function normalizeExpected(value, comparison) {
  if (!Array.isArray(value)) return value
  if (comparison === 'UNORDERED_TOP') {
    return [...value].sort((left, right) =>
      JSON.stringify(left).localeCompare(JSON.stringify(right)),
    )
  }
  if (comparison === 'UNORDERED_DEEP') {
    return value
      .map((item) =>
        Array.isArray(item)
          ? [...item].sort((left, right) =>
              JSON.stringify(left).localeCompare(JSON.stringify(right)),
            )
          : item,
      )
      .sort((left, right) =>
        JSON.stringify(left).localeCompare(JSON.stringify(right)),
      )
  }
  return value
}

function canonicalExpected(value, comparison) {
  return JSON.stringify(normalizeExpected(value, comparison))
}

function javascriptLiteral(value, type) {
  const json = JSON.stringify(value)
  if (type === 'LIST_NODE') return `__tr_buildList(${json})`
  if (type === 'TREE_NODE') return `__tr_buildTree(${json})`
  return json
}

function pythonLiteral(value, type) {
  const literal = pythonValue(value)
  if (type === 'LIST_NODE') return `__tr_build_list(${literal})`
  if (type === 'TREE_NODE') return `__tr_build_tree(${literal})`
  return literal
}

function pythonValue(value) {
  if (value === null) return 'None'
  if (value === true) return 'True'
  if (value === false) return 'False'
  if (typeof value === 'string') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(pythonValue).join(', ')}]`
  return String(value)
}

function javaLiteral(value, type) {
  switch (type) {
    case 'INTEGER':
      return String(value)
    case 'LONG':
      return `${value}L`
    case 'DOUBLE':
      return String(value)
    case 'BOOLEAN':
      return String(value)
    case 'STRING':
      return javaString(value)
    case 'INTEGER_ARRAY':
      return `new int[]{${value.join(',')}}`
    case 'STRING_ARRAY':
      return `new String[]{${value.map(javaString).join(',')}}`
    case 'INTEGER_MATRIX':
      return `new int[][]{${value
        .map((row) => `new int[]{${row.join(',')}}`)
        .join(',')}}`
    case 'STRING_MATRIX':
      return `new String[][]{${value
        .map((row) => `new String[]{${row.map(javaString).join(',')}}`)
        .join(',')}}`
    case 'CHAR_MATRIX':
      return `new char[][]{${value
        .map((row) => `new char[]{${row.map((item) => `'${item}'`).join(',')}}`)
        .join(',')}}`
    case 'LIST_NODE':
      return `Main.__trBuildList(new int[]{${value.join(',')}})`
    case 'TREE_NODE':
      return `Main.__trBuildTree(new Integer[]{${value
        .map((item) => (item === null ? 'null' : String(item)))
        .join(',')}})`
    default:
      throw new Error(`Unsupported Java input type ${type}`)
  }
}

function javaString(value) {
  return JSON.stringify(value)
    .replaceAll('\\u2028', '\\\\u2028')
    .replaceAll('\\u2029', '\\\\u2029')
}

function cppLiteral(value, type) {
  switch (type) {
    case 'INTEGER':
      return String(value)
    case 'LONG':
      return `${value}LL`
    case 'DOUBLE':
      return String(value)
    case 'BOOLEAN':
      return String(value)
    case 'STRING':
      return JSON.stringify(value)
    case 'INTEGER_ARRAY':
      return `vector<int>{${value.join(',')}}`
    case 'STRING_ARRAY':
      return `vector<string>{${value.map((item) => JSON.stringify(item)).join(',')}}`
    case 'INTEGER_MATRIX':
      return `vector<vector<int>>{${value
        .map((row) => `vector<int>{${row.join(',')}}`)
        .join(',')}}`
    case 'STRING_MATRIX':
      return `vector<vector<string>>{${value
        .map((row) => `vector<string>{${row.map((item) => JSON.stringify(item)).join(',')}}`)
        .join(',')}}`
    case 'CHAR_MATRIX':
      return `vector<vector<char>>{${value
        .map((row) => `vector<char>{${row.map((item) => `'${item}'`).join(',')}}`)
        .join(',')}}`
    case 'LIST_NODE':
      return `__trBuildList(vector<int>{${value.join(',')}})`
    case 'TREE_NODE':
      return `__trBuildTree(vector<optional<int>>{${value
        .map((item) => (item === null ? 'nullopt' : String(item)))
        .join(',')}})`
    default:
      throw new Error(`Unsupported C++ input type ${type}`)
  }
}

function parsedTests(testCases) {
  return testCases.map((test) => ({
    order: test.order,
    inputs: JSON.parse(test.inputsJson),
    expected: JSON.parse(test.expectedJson),
    inputsText: test.inputsJson,
  }))
}

function buildJavascriptSource(code, spec, tests) {
  const blocks = tests.map((test, index) => {
    const args = spec.parameters.map((parameter, argumentIndex) => {
      const name = `__tr_arg_${index}_${argumentIndex}`
      return {
        name,
        declaration: `const ${name} = ${javascriptLiteral(
          test.inputs[argumentIndex],
          parameter.type,
        )}`,
      }
    })
    const call = `new Solution().${spec.method}(${args.map((arg) => arg.name).join(', ')})`
    const actual = spec.resultMode === 'ARGUMENT'
      ? `${call}; const __tr_actual = ${args[spec.resultArgumentIndex].name}`
      : `const __tr_actual = ${call}`
    const expected = canonicalExpected(test.expected, spec.comparison)
    return `
{
  try {
    ${args.map((arg) => arg.declaration).join('\n    ')}
    ${actual}
    const __tr_actualText = __tr_canonical(
      __tr_plain(__tr_actual, ${JSON.stringify(spec.outputType)}),
      ${JSON.stringify(spec.comparison)},
    )
    if (__tr_actualText !== ${JSON.stringify(expected)}) {
      __tr_fail(${test.order}, ${index}, ${tests.length}, ${JSON.stringify(test.inputsText)}, ${JSON.stringify(expected)}, __tr_actualText)
    }
  } catch (error) {
    __tr_fail(${test.order}, ${index}, ${tests.length}, ${JSON.stringify(test.inputsText)}, ${JSON.stringify(expected)}, 'Runtime error: ' + (error?.message || String(error)))
  }
}`
  }).join('\n')

  return `${code}

function __tr_buildList(values) {
  const dummy = new ListNode()
  let current = dummy
  for (const value of values) {
    current.next = new ListNode(value)
    current = current.next
  }
  return dummy.next
}

function __tr_buildTree(values) {
  if (!values.length || values[0] == null) return null
  const root = new TreeNode(values[0])
  const queue = [root]
  let index = 1
  while (queue.length && index < values.length) {
    const node = queue.shift()
    const left = values[index++]
    if (left != null) {
      node.left = new TreeNode(left)
      queue.push(node.left)
    }
    if (index < values.length) {
      const right = values[index++]
      if (right != null) {
        node.right = new TreeNode(right)
        queue.push(node.right)
      }
    }
  }
  return root
}

function __tr_plain(value, type) {
  if (type === 'LIST_NODE') {
    const result = []
    const seen = new Set()
    while (value != null) {
      if (seen.has(value)) throw new Error('Returned linked list contains a cycle')
      seen.add(value)
      result.push(value.val)
      value = value.next
    }
    return result
  }
  return value
}

function __tr_canonical(value, comparison) {
  if (Array.isArray(value) && comparison === 'UNORDERED_TOP') {
    value = [...value].sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)))
  } else if (Array.isArray(value) && comparison === 'UNORDERED_DEEP') {
    value = value
      .map((item) => Array.isArray(item)
        ? [...item].sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)))
        : item)
      .sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)))
  }
  return JSON.stringify(value)
}

function __tr_fail(order, passed, total, input, expected, actual) {
  console.log('${detailMarker}')
  console.log('Test ' + order + ' failed\\nInput: ' + input + '\\nExpected: ' + expected + '\\nActual: ' + actual)
  console.log('${resultMarker}|' + passed + '|' + total + '|failed')
  process.exit(0)
}

${blocks}
console.log('${resultMarker}|${tests.length}|${tests.length}|passed')
`
}

function buildPythonSource(code, spec, tests) {
  const blocks = tests.map((test, index) => {
    const args = spec.parameters.map((parameter, argumentIndex) => {
      const name = `__tr_arg_${index}_${argumentIndex}`
      return {
        name,
        declaration: `${name} = ${pythonLiteral(
          test.inputs[argumentIndex],
          parameter.type,
        )}`,
      }
    })
    const call = `Solution().${spec.method}(${args.map((arg) => arg.name).join(', ')})`
    const actual = spec.resultMode === 'ARGUMENT'
      ? `${call}\n        __tr_actual = ${args[spec.resultArgumentIndex].name}`
      : `__tr_actual = ${call}`
    const expected = canonicalExpected(test.expected, spec.comparison)
    return `
try:
    ${args.map((arg) => arg.declaration).join('\n    ')}
    ${actual}
    __tr_actual_text = __tr_canonical(
        __tr_plain(__tr_actual, ${JSON.stringify(spec.outputType)}),
        ${JSON.stringify(spec.comparison)},
    )
    if __tr_actual_text != ${JSON.stringify(expected)}:
        __tr_fail(${test.order}, ${index}, ${tests.length}, ${JSON.stringify(test.inputsText)}, ${JSON.stringify(expected)}, __tr_actual_text)
except BaseException as error:
    __tr_fail(${test.order}, ${index}, ${tests.length}, ${JSON.stringify(test.inputsText)}, ${JSON.stringify(expected)}, "Runtime error: " + str(error))
`
  }).join('\n')

  return `${code}

import json as __tr_json
import sys as __tr_sys

def __tr_build_list(values):
    dummy = ListNode()
    current = dummy
    for value in values:
        current.next = ListNode(value)
        current = current.next
    return dummy.next

def __tr_build_tree(values):
    if not values or values[0] is None:
        return None
    root = TreeNode(values[0])
    queue = [root]
    index = 1
    while queue and index < len(values):
        node = queue.pop(0)
        left = values[index]
        index += 1
        if left is not None:
            node.left = TreeNode(left)
            queue.append(node.left)
        if index < len(values):
            right = values[index]
            index += 1
            if right is not None:
                node.right = TreeNode(right)
                queue.append(node.right)
    return root

def __tr_plain(value, value_type):
    if value_type == "LIST_NODE":
        result = []
        seen = set()
        while value is not None:
            if id(value) in seen:
                raise ValueError("Returned linked list contains a cycle")
            seen.add(id(value))
            result.append(value.val)
            value = value.next
        return result
    return value

def __tr_canonical(value, comparison):
    if isinstance(value, list) and comparison == "UNORDERED_TOP":
        value = sorted(value, key=lambda item: __tr_json.dumps(item, separators=(",", ":")))
    elif isinstance(value, list) and comparison == "UNORDERED_DEEP":
        value = [
            sorted(item, key=lambda child: __tr_json.dumps(child, separators=(",", ":")))
            if isinstance(item, list) else item
            for item in value
        ]
        value = sorted(value, key=lambda item: __tr_json.dumps(item, separators=(",", ":")))
    return __tr_json.dumps(value, separators=(",", ":"))

def __tr_fail(order, passed, total, input_text, expected, actual):
    print("${detailMarker}")
    print(f"Test {order} failed\\nInput: {input_text}\\nExpected: {expected}\\nActual: {actual}")
    print(f"${resultMarker}|{passed}|{total}|failed")
    __tr_sys.exit(0)

${blocks}
print("${resultMarker}|${tests.length}|${tests.length}|passed")
`
}

function buildJavaSource(code, spec, tests) {
  const usesListNode = spec.returnType === 'LIST_NODE'
    || spec.outputType === 'LIST_NODE'
    || spec.parameters.some((parameter) => parameter.type === 'LIST_NODE')
  const usesTreeNode = spec.returnType === 'TREE_NODE'
    || spec.outputType === 'TREE_NODE'
    || spec.parameters.some((parameter) => parameter.type === 'TREE_NODE')
  const listHelpers = usesListNode ? `
    static ListNode __trBuildList(int[] values) {
        ListNode dummy = new ListNode(0);
        ListNode current = dummy;
        for (int value : values) {
            current.next = new ListNode(value);
            current = current.next;
        }
        return dummy.next;
    }
` : ''
  const treeHelpers = usesTreeNode ? `
    static TreeNode __trBuildTree(Integer[] values) {
        if (values.length == 0 || values[0] == null) return null;
        TreeNode root = new TreeNode(values[0]);
        Queue<TreeNode> queue = new ArrayDeque<>();
        queue.add(root);
        int index = 1;
        while (!queue.isEmpty() && index < values.length) {
            TreeNode node = queue.remove();
            Integer left = values[index++];
            if (left != null) {
                node.left = new TreeNode(left);
                queue.add(node.left);
            }
            if (index < values.length) {
                Integer right = values[index++];
                if (right != null) {
                    node.right = new TreeNode(right);
                    queue.add(node.right);
                }
            }
        }
        return root;
    }
` : ''
  const listPlain = usesListNode ? `
        if ("LIST_NODE".equals(type)) {
            List<Integer> result = new ArrayList<>();
            Set<ListNode> seen = Collections.newSetFromMap(new IdentityHashMap<>());
            ListNode node = (ListNode) value;
            while (node != null) {
                if (!seen.add(node)) throw new IllegalArgumentException("Returned linked list contains a cycle");
                result.add(node.val);
                node = node.next;
            }
            return result;
        }
` : ''
  const blocks = tests.map((test, index) => {
    const args = spec.parameters.map((parameter, argumentIndex) => {
      const name = `__trArg${index}_${argumentIndex}`
      return {
        name,
        type: javaType(parameter.type),
        declaration: `${javaType(parameter.type)} ${name} = ${javaLiteral(
          test.inputs[argumentIndex],
          parameter.type,
        )};`,
      }
    })
    const call = `new Solution().${spec.method}(${args.map((arg) => arg.name).join(', ')})`
    const actual = spec.resultMode === 'ARGUMENT'
      ? `${call};\n                Object __trActual = ${args[spec.resultArgumentIndex].name};`
      : `Object __trActual = ${call};`
    const expected = canonicalExpected(test.expected, spec.comparison)
    return `
        try {
            ${args.map((arg) => arg.declaration).join('\n            ')}
            ${actual}
            String __trActualText = __trCanonical(
                __trPlain(__trActual, ${javaString(spec.outputType)}),
                ${javaString(spec.comparison)}
            );
            if (!__trActualText.equals(${javaString(expected)})) {
                __trFail(${test.order}, ${index}, ${tests.length}, ${javaString(test.inputsText)}, ${javaString(expected)}, __trActualText);
            }
        } catch (Throwable error) {
            __trFail(${test.order}, ${index}, ${tests.length}, ${javaString(test.inputsText)}, ${javaString(expected)}, "Runtime error: " + error);
        }`
  }).join('\n')

  return `import java.util.*;

${code}

public class Main {
${listHelpers}
${treeHelpers}

    static Object __trPlain(Object value, String type) {
${listPlain}
        return value;
    }

    static List<Object> __trList(Object value) {
        List<Object> result = new ArrayList<>();
        if (value == null) return result;
        if (value instanceof Collection<?> collection) {
            result.addAll(collection);
            return result;
        }
        if (value.getClass().isArray()) {
            int length = java.lang.reflect.Array.getLength(value);
            for (int index = 0; index < length; index++) {
                result.add(java.lang.reflect.Array.get(value, index));
            }
            return result;
        }
        throw new IllegalArgumentException("Expected an array result");
    }

    static String __trCanonical(Object value, String comparison) {
        if ("UNORDERED_TOP".equals(comparison)) {
            List<Object> values = __trList(value);
            values.sort(Comparator.comparing(Main::__trJson));
            value = values;
        } else if ("UNORDERED_DEEP".equals(comparison)) {
            List<Object> outer = __trList(value);
            List<Object> normalized = new ArrayList<>();
            for (Object item : outer) {
                List<Object> inner = __trList(item);
                inner.sort(Comparator.comparing(Main::__trJson));
                normalized.add(inner);
            }
            normalized.sort(Comparator.comparing(Main::__trJson));
            value = normalized;
        }
        return __trJson(value);
    }

    static String __trJson(Object value) {
        if (value == null) return "null";
        if (value instanceof String text) {
            return "\\"" + text.replace("\\\\", "\\\\\\\\").replace("\\"", "\\\\\\"") + "\\"";
        }
        if (value instanceof Character character) return __trJson(character.toString());
        if (value instanceof Boolean || value instanceof Number) return value.toString();
        List<Object> values = __trList(value);
        StringJoiner joiner = new StringJoiner(",", "[", "]");
        for (Object item : values) joiner.add(__trJson(item));
        return joiner.toString();
    }

    static void __trFail(int order, int passed, int total, String input, String expected, String actual) {
        System.out.println("${detailMarker}");
        System.out.println("Test " + order + " failed\\nInput: " + input + "\\nExpected: " + expected + "\\nActual: " + actual);
        System.out.println("${resultMarker}|" + passed + "|" + total + "|failed");
        System.exit(0);
    }

    public static void main(String[] args) {
${blocks}
        System.out.println("${resultMarker}|${tests.length}|${tests.length}|passed");
    }
}
`
}

function javaType(type) {
  switch (type) {
    case 'INTEGER': return 'int'
    case 'LONG': return 'long'
    case 'DOUBLE': return 'double'
    case 'BOOLEAN': return 'boolean'
    case 'STRING': return 'String'
    case 'INTEGER_ARRAY': return 'int[]'
    case 'STRING_ARRAY': return 'String[]'
    case 'INTEGER_MATRIX': return 'int[][]'
    case 'STRING_MATRIX': return 'String[][]'
    case 'CHAR_MATRIX': return 'char[][]'
    case 'LIST_NODE': return 'ListNode'
    case 'TREE_NODE': return 'TreeNode'
    default: throw new Error(`Unsupported Java type ${type}`)
  }
}

function buildCppSource(code, spec, tests) {
  const usesListNode = spec.returnType === 'LIST_NODE'
    || spec.outputType === 'LIST_NODE'
    || spec.parameters.some((parameter) => parameter.type === 'LIST_NODE')
  const usesTreeNode = spec.returnType === 'TREE_NODE'
    || spec.outputType === 'TREE_NODE'
    || spec.parameters.some((parameter) => parameter.type === 'TREE_NODE')
  const listHelpers = usesListNode ? `
ListNode* __trBuildList(const vector<int>& values) {
    ListNode dummy(0);
    ListNode* current = &dummy;
    for (int value : values) {
        current->next = new ListNode(value);
        current = current->next;
    }
    return dummy.next;
}

vector<int> __trListToVector(ListNode* node) {
    vector<int> result;
    unordered_set<ListNode*> seen;
    while (node != nullptr) {
        if (!seen.insert(node).second) throw runtime_error("Returned linked list contains a cycle");
        result.push_back(node->val);
        node = node->next;
    }
    return result;
}
` : ''
  const treeHelpers = usesTreeNode ? `
TreeNode* __trBuildTree(const vector<optional<int>>& values) {
    if (values.empty() || !values[0].has_value()) return nullptr;
    TreeNode* root = new TreeNode(*values[0]);
    queue<TreeNode*> nodes;
    nodes.push(root);
    size_t index = 1;
    while (!nodes.empty() && index < values.size()) {
        TreeNode* node = nodes.front();
        nodes.pop();
        if (values[index].has_value()) {
            node->left = new TreeNode(*values[index]);
            nodes.push(node->left);
        }
        index++;
        if (index < values.size()) {
            if (values[index].has_value()) {
                node->right = new TreeNode(*values[index]);
                nodes.push(node->right);
            }
            index++;
        }
    }
    return root;
}
` : ''
  const blocks = tests.map((test, index) => {
    const args = spec.parameters.map((parameter, argumentIndex) => {
      const name = `__trArg${index}_${argumentIndex}`
      return {
        name,
        type: cppType(parameter.type),
        declaration: `${cppType(parameter.type)} ${name} = ${cppLiteral(
          test.inputs[argumentIndex],
          parameter.type,
        )};`,
      }
    })
    const call = `Solution().${spec.method}(${args.map((arg) => arg.name).join(', ')})`
    let actual
    if (spec.resultMode === 'ARGUMENT') {
      actual = `${call};\n            auto __trActual = ${args[spec.resultArgumentIndex].name};`
    } else if (spec.outputType === 'LIST_NODE') {
      actual = `auto __trActual = __trListToVector(${call});`
    } else {
      actual = `auto __trActual = ${call};`
    }
    let normalization = ''
    if (spec.comparison === 'UNORDERED_TOP') {
      normalization = 'sort(__trActual.begin(), __trActual.end());'
    } else if (spec.comparison === 'UNORDERED_DEEP') {
      normalization = `
            for (auto& __trInner : __trActual) sort(__trInner.begin(), __trInner.end());
            sort(__trActual.begin(), __trActual.end());`
    }
    const expected = canonicalExpected(test.expected, spec.comparison)
    return `
        try {
            ${args.map((arg) => arg.declaration).join('\n            ')}
            ${actual}
            ${normalization}
            string __trActualText = __trJson(__trActual);
            if (__trActualText != ${JSON.stringify(expected)}) {
                __trFail(${test.order}, ${index}, ${tests.length}, ${JSON.stringify(test.inputsText)}, ${JSON.stringify(expected)}, __trActualText);
            }
        } catch (const exception& error) {
            __trFail(${test.order}, ${index}, ${tests.length}, ${JSON.stringify(test.inputsText)}, ${JSON.stringify(expected)}, string("Runtime error: ") + error.what());
        } catch (...) {
            __trFail(${test.order}, ${index}, ${tests.length}, ${JSON.stringify(test.inputsText)}, ${JSON.stringify(expected)}, "Runtime error: unknown exception");
        }`
  }).join('\n')

  return `#include <algorithm>
#include <cmath>
#include <cstdlib>
#include <exception>
#include <iostream>
#include <optional>
#include <queue>
#include <set>
#include <stdexcept>
#include <string>
#include <type_traits>
#include <unordered_map>
#include <unordered_set>
#include <utility>
#include <vector>
using namespace std;

${code}

${listHelpers}
${treeHelpers}

string __trEscape(const string& value) {
    string result = "\\"";
    for (char character : value) {
        if (character == '\\\\' || character == '\\"') result += '\\\\';
        result += character;
    }
    return result + "\\"";
}

string __trJson(const string& value) { return __trEscape(value); }
string __trJson(const char* value) { return __trEscape(value); }
string __trJson(char value) { return __trEscape(string(1, value)); }
string __trJson(bool value) { return value ? "true" : "false"; }
template <typename T>
enable_if_t<is_arithmetic_v<T> && !is_same_v<T, bool>, string> __trJson(T value) {
    return to_string(value);
}
template <typename T>
string __trJson(const vector<T>& values) {
    string result = "[";
    for (size_t index = 0; index < values.size(); index++) {
        if (index > 0) result += ",";
        result += __trJson(values[index]);
    }
    return result + "]";
}

void __trFail(int order, int passed, int total, const string& input, const string& expected, const string& actual) {
    cout << "${detailMarker}\\n";
    cout << "Test " << order << " failed\\nInput: " << input << "\\nExpected: " << expected << "\\nActual: " << actual << "\\n";
    cout << "${resultMarker}|" << passed << "|" << total << "|failed\\n";
    exit(0);
}

int main() {
${blocks}
    cout << "${resultMarker}|${tests.length}|${tests.length}|passed\\n";
    return 0;
}
`
}

function cppType(type) {
  switch (type) {
    case 'INTEGER': return 'int'
    case 'LONG': return 'long long'
    case 'DOUBLE': return 'double'
    case 'BOOLEAN': return 'bool'
    case 'STRING': return 'string'
    case 'INTEGER_ARRAY': return 'vector<int>'
    case 'STRING_ARRAY': return 'vector<string>'
    case 'INTEGER_MATRIX': return 'vector<vector<int>>'
    case 'STRING_MATRIX': return 'vector<vector<string>>'
    case 'CHAR_MATRIX': return 'vector<vector<char>>'
    case 'LIST_NODE': return 'ListNode*'
    case 'TREE_NODE': return 'TreeNode*'
    default: throw new Error(`Unsupported C++ type ${type}`)
  }
}

function buildProgram({ language, code, spec, testCases }) {
  const tests = parsedTests(testCases)
  if (!tests.length) throw new Error('No test cases were provided')
  if (language === 'JavaScript') {
    return {
      file: 'solution.js',
      source: buildJavascriptSource(code, spec, tests),
      compile: null,
      run: ['node', ['solution.js']],
    }
  }
  if (language === 'Python') {
    return {
      file: 'solution.py',
      source: buildPythonSource(code, spec, tests),
      compile: null,
      run: ['python3', ['solution.py']],
    }
  }
  if (language === 'Java') {
    return {
      file: 'Main.java',
      source: buildJavaSource(code, spec, tests),
      compile: ['javac', ['Main.java']],
      run: ['java', ['-cp', '.', 'Main']],
    }
  }
  if (language === 'C++') {
    return {
      file: 'solution.cpp',
      source: buildCppSource(code, spec, tests),
      compile: ['g++', ['-std=c++20', '-O2', 'solution.cpp', '-o', 'solution']],
      run: ['./solution', []],
    }
  }
  throw new Error(`${language} is not enabled by TraceRound.`)
}

function parseHarnessResult(result, totalTests) {
  const combined = `${result.stdout}\n${result.stderr}`
  const matches = [...combined.matchAll(
    new RegExp(`${resultMarker.replaceAll('_', '\\_')}\\|(\\d+)\\|(\\d+)\\|(passed|failed)`, 'g'),
  )]
  const marker = matches.at(-1)
  if (!marker) return null

  const passedTests = Number(marker[1])
  const reportedTotal = Number(marker[2])
  const status = marker[3]
  let output
  if (status === 'passed') {
    output = `All ${reportedTotal} test cases passed.`
  } else {
    const detailIndex = combined.lastIndexOf(detailMarker)
    const resultIndex = combined.lastIndexOf(resultMarker)
    output = combined
      .slice(detailIndex >= 0 ? detailIndex + detailMarker.length : 0, resultIndex)
      .trim()
  }
  return {
    status: status === 'passed' ? 'success' : 'error',
    summary: status === 'passed' ? 'All tests passed' : 'Test case failed',
    output: output || 'The solution did not produce a test result.',
    passedTests,
    totalTests: reportedTotal || totalTests,
  }
}

async function execute(request) {
  if (typeof request.code !== 'string' || !request.code.trim()) {
    return {
      status: 'error',
      summary: 'No code to run',
      output: 'Add a solution before running it.',
      passedTests: 0,
      totalTests: request.testCases?.length || 0,
    }
  }

  const directory = await mkdtemp(path.join(tmpdir(), 'traceround-'))
  try {
    const program = buildProgram(request)
    await writeFile(path.join(directory, program.file), program.source, 'utf8')

    if (program.compile) {
      const compiled = await runProcess(
        program.compile[0],
        program.compile[1],
        directory,
      )
      if (compiled.exitCode !== 0 || compiled.timedOut) {
        return {
          status: 'error',
          summary: compiled.timedOut ? 'Compilation timed out' : 'Compilation failed',
          output: (compiled.stderr || compiled.stdout || 'Compiler returned an error.').trim(),
          passedTests: 0,
          totalTests: request.testCases.length,
        }
      }
    }

    const result = await runProcess(program.run[0], program.run[1], directory)
    if (result.timedOut) {
      return {
        status: 'error',
        summary: 'Execution timed out',
        output: 'The solution exceeded the execution time limit.',
        passedTests: 0,
        totalTests: request.testCases.length,
      }
    }

    const harnessResult = parseHarnessResult(result, request.testCases.length)
    if (harnessResult) return harnessResult
    return {
      status: 'error',
      summary: 'Execution failed',
      output: (result.stderr || result.stdout || 'Program exited without a test result.').trim(),
      passedTests: 0,
      totalTests: request.testCases.length,
    }
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
}

const server = http.createServer((request, response) => {
  if (request.method === 'GET' && request.url === '/health') {
    response.writeHead(200, { 'content-type': 'application/json' })
    response.end(JSON.stringify({ status: 'ok', service: 'traceround-code-runner' }))
    return
  }

  if (request.method !== 'POST' || request.url !== '/execute') {
    response.writeHead(404, { 'content-type': 'application/json' })
    response.end(JSON.stringify({ error: 'Not found' }))
    return
  }

  let body = ''
  let bodyBytes = 0
  request.on('data', (chunk) => {
    bodyBytes += chunk.length
    if (bodyBytes > maxBodyBytes) request.destroy()
    else body += chunk
  })
  request.on('end', async () => {
    try {
      const result = await execute(JSON.parse(body))
      response.writeHead(200, { 'content-type': 'application/json' })
      response.end(JSON.stringify(result))
    } catch (error) {
      response.writeHead(400, { 'content-type': 'application/json' })
      response.end(JSON.stringify({
        status: 'error',
        summary: 'Invalid execution request',
        output: error instanceof Error ? error.message : 'Invalid execution request',
        passedTests: 0,
        totalTests: 0,
      }))
    }
  })
})

server.listen(port, '0.0.0.0', () => {
  process.stdout.write(`TraceRound code runner listening on ${port}\n`)
})
