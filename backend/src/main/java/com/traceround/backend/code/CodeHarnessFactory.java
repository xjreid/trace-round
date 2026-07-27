package com.traceround.backend.code;

import com.traceround.backend.code.CodeExecutionClient.TestCase;
import com.traceround.backend.problem.ProblemExecutionSpec;
import com.traceround.backend.problem.ProblemExecutionSpec.Parameter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import org.springframework.stereotype.Component;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ArrayNode;

/**
 * Combines the user's Solution class with all test cases. Judge0 therefore
 * consumes one submission per Run click and never needs TraceRound's database.
 */
@Component
public class CodeHarnessFactory {

    private final ObjectMapper json;

    public CodeHarnessFactory(ObjectMapper json) {
        this.json = json;
    }

    public String build(
        String language,
        String code,
        ProblemExecutionSpec spec,
        List<TestCase> testCases
    ) {
        List<ParsedTest> tests = parse(testCases, spec.comparison());
        if (tests.isEmpty()) throw new IllegalArgumentException("No test cases were provided.");
        return switch (language) {
            case "JavaScript" -> javascript(code, spec, tests);
            case "Python" -> python(code, spec, tests);
            case "Java" -> java(code, spec, tests);
            case "C++" -> cpp(code, spec, tests);
            default -> throw new IllegalArgumentException(
                language + " is not enabled by TraceRound."
            );
        };
    }

    private List<ParsedTest> parse(List<TestCase> tests, String comparison) {
        try {
            List<ParsedTest> parsed = new ArrayList<>();
            for (TestCase test : tests) {
                JsonNode inputs = json.readTree(test.inputsJson());
                if (!inputs.isArray()) {
                    throw new IllegalArgumentException("Test inputs must be a JSON array.");
                }
                JsonNode expected = normalize(json.readTree(test.expectedJson()), comparison);
                parsed.add(new ParsedTest(
                    test.order(), (ArrayNode) inputs, json.writeValueAsString(expected),
                    test.inputsJson()
                ));
            }
            return parsed;
        } catch (JacksonException exception) {
            throw new IllegalArgumentException("A problem contains invalid test-case JSON.", exception);
        }
    }

    private JsonNode normalize(JsonNode value, String comparison) {
        if (!value.isArray()) return value;
        ArrayNode result = json.createArrayNode();
        List<JsonNode> items = new ArrayList<>();
        value.forEach(items::add);
        if ("UNORDERED_DEEP".equals(comparison)) {
            items.replaceAll(item -> {
                if (!item.isArray()) return item;
                List<JsonNode> children = new ArrayList<>();
                item.forEach(children::add);
                children.sort(Comparator.comparing(JsonNode::toString));
                ArrayNode inner = json.createArrayNode();
                children.forEach(inner::add);
                return inner;
            });
        }
        if ("UNORDERED_TOP".equals(comparison) || "UNORDERED_DEEP".equals(comparison)) {
            items.sort(Comparator.comparing(JsonNode::toString));
        }
        items.forEach(result::add);
        return result;
    }

    private String javascript(
        String code,
        ProblemExecutionSpec spec,
        List<ParsedTest> tests
    ) {
        StringBuilder blocks = new StringBuilder();
        for (int index = 0; index < tests.size(); index++) {
            ParsedTest test = tests.get(index);
            List<String> names = new ArrayList<>();
            StringBuilder declarations = new StringBuilder();
            for (int argument = 0; argument < spec.parameters().size(); argument++) {
                String name = "__tr_arg_" + index + "_" + argument;
                names.add(name);
                declarations.append("    const ").append(name).append(" = ")
                    .append(javascriptLiteral(
                        test.inputs().get(argument),
                        spec.parameters().get(argument).type()
                    )).append(";\n");
            }
            String call = "new Solution()." + spec.method() + "("
                + String.join(", ", names) + ")";
            String actual = "ARGUMENT".equals(spec.resultMode())
                ? call + ";\n    const __tr_actual = "
                    + names.get(spec.resultArgumentIndex()) + ";"
                : "const __tr_actual = " + call + ";";
            blocks.append("""
                {
                  try {
                {{DECLARATIONS}}    {{ACTUAL}}
                    const __tr_actualText = __tr_canonical(
                      __tr_plain(__tr_actual, {{OUTPUT_TYPE}}),
                      {{COMPARISON}}
                    );
                    if (__tr_actualText !== {{EXPECTED_LITERAL}}) {
                      __tr_fail({{ORDER}}, {{PASSED}}, {{TOTAL}}, {{INPUT}},
                        {{EXPECTED_DISPLAY}}, __tr_actualText);
                    }
                  } catch (error) {
                    __tr_fail({{ORDER}}, {{PASSED}}, {{TOTAL}}, {{INPUT}},
                      {{EXPECTED_DISPLAY}}, "Runtime error: " + (error?.message || String(error)));
                  }
                }
                """.replace("{{DECLARATIONS}}", declarations)
                .replace("{{ACTUAL}}", actual)
                .replace("{{OUTPUT_TYPE}}", jsString(spec.outputType()))
                .replace("{{COMPARISON}}", jsString(spec.comparison()))
                .replace("{{EXPECTED_LITERAL}}", jsString(test.expectedCanonical()))
                .replace("{{EXPECTED_DISPLAY}}", jsString(test.expectedCanonical()))
                .replace("{{ORDER}}", Integer.toString(test.order()))
                .replace("{{PASSED}}", Integer.toString(index))
                .replace("{{TOTAL}}", Integer.toString(tests.size()))
                .replace("{{INPUT}}", jsString(test.inputsText())));
        }
        return code + "\n" + """
            function __tr_buildList(values) {
              const dummy = new ListNode();
              let current = dummy;
              for (const value of values) {
                current.next = new ListNode(value);
                current = current.next;
              }
              return dummy.next;
            }
            function __tr_buildTree(values) {
              if (!values.length || values[0] == null) return null;
              const root = new TreeNode(values[0]);
              const queue = [root];
              let index = 1;
              while (queue.length && index < values.length) {
                const node = queue.shift();
                const left = values[index++];
                if (left != null) {
                  node.left = new TreeNode(left);
                  queue.push(node.left);
                }
                if (index < values.length) {
                  const right = values[index++];
                  if (right != null) {
                    node.right = new TreeNode(right);
                    queue.push(node.right);
                  }
                }
              }
              return root;
            }
            function __tr_plain(value, type) {
              if (type === "LIST_NODE") {
                const result = [];
                const seen = new Set();
                while (value != null) {
                  if (seen.has(value)) throw new Error("Returned linked list contains a cycle");
                  seen.add(value);
                  result.push(value.val);
                  value = value.next;
                }
                return result;
              }
              return value;
            }
            function __tr_canonical(value, comparison) {
              if (Array.isArray(value) && comparison === "UNORDERED_TOP") {
                value = [...value].sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
              } else if (Array.isArray(value) && comparison === "UNORDERED_DEEP") {
                value = value.map(item => Array.isArray(item)
                  ? [...item].sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)))
                  : item
                ).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
              }
              return JSON.stringify(value);
            }
            function __tr_fail(order, passed, total, input, expected, actual) {
              console.log("__TRACEROUND_DETAIL__");
              console.log("Test " + order + " failed\\nInput: " + input
                + "\\nExpected: " + expected + "\\nActual: " + actual);
              console.log("__TRACEROUND_RESULT__|" + passed + "|" + total + "|failed");
              process.exit(0);
            }
            """ + blocks
            + "console.log(\"__TRACEROUND_RESULT__|" + tests.size()
            + "|" + tests.size() + "|passed\");\n";
    }

    private String python(
        String code,
        ProblemExecutionSpec spec,
        List<ParsedTest> tests
    ) {
        StringBuilder blocks = new StringBuilder();
        for (int index = 0; index < tests.size(); index++) {
            ParsedTest test = tests.get(index);
            List<String> names = new ArrayList<>();
            StringBuilder declarations = new StringBuilder();
            for (int argument = 0; argument < spec.parameters().size(); argument++) {
                String name = "__tr_arg_" + index + "_" + argument;
                names.add(name);
                declarations.append("    ").append(name).append(" = ")
                    .append(pythonLiteral(
                        test.inputs().get(argument),
                        spec.parameters().get(argument).type()
                    )).append("\n");
            }
            String call = "Solution()." + spec.method() + "("
                + String.join(", ", names) + ")";
            String actual = "ARGUMENT".equals(spec.resultMode())
                ? "    " + call + "\n    __tr_actual = "
                    + names.get(spec.resultArgumentIndex())
                : "    __tr_actual = " + call;
            blocks.append("""
                try:
                {{DECLARATIONS}}{{ACTUAL}}
                    __tr_actual_text = __tr_canonical(
                        __tr_plain(__tr_actual, {{OUTPUT_TYPE}}), {{COMPARISON}}
                    )
                    if __tr_actual_text != {{EXPECTED}}:
                        __tr_fail({{ORDER}}, {{PASSED}}, {{TOTAL}}, {{INPUT}},
                                  {{EXPECTED}}, __tr_actual_text)
                except BaseException as error:
                    __tr_fail({{ORDER}}, {{PASSED}}, {{TOTAL}}, {{INPUT}},
                              {{EXPECTED}}, "Runtime error: " + str(error))

                """.replace("{{DECLARATIONS}}", declarations)
                .replace("{{ACTUAL}}", actual)
                .replace("{{OUTPUT_TYPE}}", pythonString(spec.outputType()))
                .replace("{{COMPARISON}}", pythonString(spec.comparison()))
                .replace("{{EXPECTED}}", pythonString(test.expectedCanonical()))
                .replace("{{ORDER}}", Integer.toString(test.order()))
                .replace("{{PASSED}}", Integer.toString(index))
                .replace("{{TOTAL}}", Integer.toString(tests.size()))
                .replace("{{INPUT}}", pythonString(test.inputsText())));
        }
        return code + "\n" + """
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
                        if isinstance(item, list) else item for item in value
                    ]
                    value = sorted(value, key=lambda item: __tr_json.dumps(item, separators=(",", ":")))
                return __tr_json.dumps(value, separators=(",", ":"))

            def __tr_fail(order, passed, total, input_text, expected, actual):
                print("__TRACEROUND_DETAIL__")
                print(f"Test {order} failed\\nInput: {input_text}\\nExpected: {expected}\\nActual: {actual}")
                print(f"__TRACEROUND_RESULT__|{passed}|{total}|failed")
                __tr_sys.exit(0)

            """ + blocks
            + "print(\"__TRACEROUND_RESULT__|" + tests.size()
            + "|" + tests.size() + "|passed\")\n";
    }

    private String java(
        String code,
        ProblemExecutionSpec spec,
        List<ParsedTest> tests
    ) {
        boolean list = uses(spec, "LIST_NODE");
        boolean tree = uses(spec, "TREE_NODE");
        StringBuilder blocks = new StringBuilder();
        for (int index = 0; index < tests.size(); index++) {
            ParsedTest test = tests.get(index);
            List<String> names = new ArrayList<>();
            StringBuilder declarations = new StringBuilder();
            for (int argument = 0; argument < spec.parameters().size(); argument++) {
                Parameter parameter = spec.parameters().get(argument);
                String name = "__trArg" + index + "_" + argument;
                names.add(name);
                declarations.append("            ").append(javaType(parameter.type()))
                    .append(" ").append(name).append(" = ")
                    .append(javaLiteral(test.inputs().get(argument), parameter.type()))
                    .append(";\n");
            }
            String call = "new Solution()." + spec.method() + "("
                + String.join(", ", names) + ")";
            String actual = "ARGUMENT".equals(spec.resultMode())
                ? call + ";\n            Object __trActual = "
                    + names.get(spec.resultArgumentIndex()) + ";"
                : "Object __trActual = " + call + ";";
            blocks.append("""
                        try {
                {{DECLARATIONS}}            {{ACTUAL}}
                            String __trActualText = __trCanonical(
                                __trPlain(__trActual, {{OUTPUT_TYPE}}), {{COMPARISON}}
                            );
                            if (!__trActualText.equals({{EXPECTED}})) {
                                __trFail({{ORDER}}, {{PASSED}}, {{TOTAL}}, {{INPUT}},
                                    {{EXPECTED}}, __trActualText);
                            }
                        } catch (Throwable error) {
                            __trFail({{ORDER}}, {{PASSED}}, {{TOTAL}}, {{INPUT}},
                                {{EXPECTED}}, "Runtime error: " + error);
                        }
                """.replace("{{DECLARATIONS}}", declarations)
                .replace("{{ACTUAL}}", actual)
                .replace("{{OUTPUT_TYPE}}", javaString(spec.outputType()))
                .replace("{{COMPARISON}}", javaString(spec.comparison()))
                .replace("{{EXPECTED}}", javaString(test.expectedCanonical()))
                .replace("{{ORDER}}", Integer.toString(test.order()))
                .replace("{{PASSED}}", Integer.toString(index))
                .replace("{{TOTAL}}", Integer.toString(tests.size()))
                .replace("{{INPUT}}", javaString(test.inputsText())));
        }
        String helpers = "";
        if (list) helpers += """
                static ListNode __trBuildList(int[] values) {
                    ListNode dummy = new ListNode(0), current = dummy;
                    for (int value : values) {
                        current.next = new ListNode(value);
                        current = current.next;
                    }
                    return dummy.next;
                }
            """;
        if (tree) helpers += """
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
            """;
        String listPlain = list ? """
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
            """ : "";
        return "import java.util.*;\n\n" + code + "\n\npublic class Main {\n"
            + helpers + """
                static Object __trPlain(Object value, String type) {
            """ + listPlain + """
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
                        for (int i = 0; i < length; i++) {
                            result.add(java.lang.reflect.Array.get(value, i));
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
                        return "\\\"" + text.replace("\\\\", "\\\\\\\\").replace("\\\"", "\\\\\\\"") + "\\\"";
                    }
                    if (value instanceof Character c) return __trJson(c.toString());
                    if (value instanceof Boolean || value instanceof Number) return value.toString();
                    List<Object> values = __trList(value);
                    StringJoiner joiner = new StringJoiner(",", "[", "]");
                    for (Object item : values) joiner.add(__trJson(item));
                    return joiner.toString();
                }
                static void __trFail(int order, int passed, int total, String input,
                                     String expected, String actual) {
                    System.out.println("__TRACEROUND_DETAIL__");
                    System.out.println("Test " + order + " failed\\nInput: " + input
                        + "\\nExpected: " + expected + "\\nActual: " + actual);
                    System.out.println("__TRACEROUND_RESULT__|" + passed + "|" + total + "|failed");
                    System.exit(0);
                }
                public static void main(String[] args) {
            """ + blocks
            + "        System.out.println(\"__TRACEROUND_RESULT__|" + tests.size()
            + "|" + tests.size() + "|passed\");\n    }\n}\n";
    }

    private String cpp(
        String code,
        ProblemExecutionSpec spec,
        List<ParsedTest> tests
    ) {
        boolean list = uses(spec, "LIST_NODE");
        boolean tree = uses(spec, "TREE_NODE");
        StringBuilder blocks = new StringBuilder();
        for (int index = 0; index < tests.size(); index++) {
            ParsedTest test = tests.get(index);
            List<String> names = new ArrayList<>();
            StringBuilder declarations = new StringBuilder();
            for (int argument = 0; argument < spec.parameters().size(); argument++) {
                Parameter parameter = spec.parameters().get(argument);
                String name = "__trArg" + index + "_" + argument;
                names.add(name);
                declarations.append("        ").append(cppType(parameter.type()))
                    .append(" ").append(name).append(" = ")
                    .append(cppLiteral(test.inputs().get(argument), parameter.type()))
                    .append(";\n");
            }
            String call = "Solution()." + spec.method() + "("
                + String.join(", ", names) + ")";
            String actual;
            if ("ARGUMENT".equals(spec.resultMode())) {
                actual = call + ";\n        auto __trActual = "
                    + names.get(spec.resultArgumentIndex()) + ";";
            } else if ("LIST_NODE".equals(spec.outputType())) {
                actual = "auto __trActual = __trListToVector(" + call + ");";
            } else {
                actual = "auto __trActual = " + call + ";";
            }
            String normalization = switch (spec.comparison()) {
                case "UNORDERED_TOP" -> "sort(__trActual.begin(), __trActual.end());";
                case "UNORDERED_DEEP" -> """
                    for (auto& __trInner : __trActual) sort(__trInner.begin(), __trInner.end());
                            sort(__trActual.begin(), __trActual.end());""";
                default -> "";
            };
            blocks.append("""
                    try {
                {{DECLARATIONS}}        {{ACTUAL}}
                        {{NORMALIZATION}}
                        string __trActualText = __trJson(__trActual);
                        if (__trActualText != {{EXPECTED}}) {
                            __trFail({{ORDER}}, {{PASSED}}, {{TOTAL}}, {{INPUT}},
                                {{EXPECTED}}, __trActualText);
                        }
                    } catch (const exception& error) {
                        __trFail({{ORDER}}, {{PASSED}}, {{TOTAL}}, {{INPUT}},
                            {{EXPECTED}}, string("Runtime error: ") + error.what());
                    } catch (...) {
                        __trFail({{ORDER}}, {{PASSED}}, {{TOTAL}}, {{INPUT}},
                            {{EXPECTED}}, "Runtime error: unknown exception");
                    }
                """.replace("{{DECLARATIONS}}", declarations)
                .replace("{{ACTUAL}}", actual)
                .replace("{{NORMALIZATION}}", normalization)
                .replace("{{EXPECTED}}", cppString(test.expectedCanonical()))
                .replace("{{ORDER}}", Integer.toString(test.order()))
                .replace("{{PASSED}}", Integer.toString(index))
                .replace("{{TOTAL}}", Integer.toString(tests.size()))
                .replace("{{INPUT}}", cppString(test.inputsText())));
        }
        String helpers = "";
        if (list) helpers += """
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
            """;
        if (tree) helpers += """
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
            """;
        return """
            #include <algorithm>
            #include <cstdlib>
            #include <exception>
            #include <iostream>
            #include <optional>
            #include <queue>
            #include <stdexcept>
            #include <string>
            #include <type_traits>
            #include <unordered_set>
            #include <vector>
            using namespace std;

            """ + code + "\n\n" + helpers + """
            string __trEscape(const string& value) {
                string result = "\\\"";
                for (char c : value) {
                    if (c == '\\\\' || c == '"') result += '\\\\';
                    result += c;
                }
                return result + "\\\"";
            }
            string __trJson(const string& value) { return __trEscape(value); }
            string __trJson(const char* value) { return __trEscape(value); }
            string __trJson(char value) { return __trEscape(string(1, value)); }
            string __trJson(bool value) { return value ? "true" : "false"; }
            template <typename T>
            enable_if_t<is_arithmetic_v<T> && !is_same_v<T, bool>, string> __trJson(T value) {
                if constexpr (is_floating_point_v<T>) {
                    string result = to_string(value);
                    while (result.size() > 1 && result.back() == '0') result.pop_back();
                    if (!result.empty() && result.back() == '.') result.pop_back();
                    return result;
                }
                return to_string(value);
            }
            template <typename T>
            string __trJson(const vector<T>& values) {
                string result = "[";
                for (size_t i = 0; i < values.size(); i++) {
                    if (i > 0) result += ",";
                    result += __trJson(values[i]);
                }
                return result + "]";
            }
            void __trFail(int order, int passed, int total, const string& input,
                          const string& expected, const string& actual) {
                cout << "__TRACEROUND_DETAIL__\\n";
                cout << "Test " << order << " failed\\nInput: " << input
                     << "\\nExpected: " << expected << "\\nActual: " << actual << "\\n";
                cout << "__TRACEROUND_RESULT__|" << passed << "|" << total << "|failed\\n";
                exit(0);
            }
            int main() {
            """ + blocks
            + "    cout << \"__TRACEROUND_RESULT__|" + tests.size()
            + "|" + tests.size() + "|passed\\n\";\n    return 0;\n}\n";
    }

    private String javascriptLiteral(JsonNode value, String type) {
        String raw = value.toString();
        return switch (type) {
            case "LIST_NODE" -> "__tr_buildList(" + raw + ")";
            case "TREE_NODE" -> "__tr_buildTree(" + raw + ")";
            default -> raw;
        };
    }

    private String pythonLiteral(JsonNode value, String type) {
        String raw = pythonValue(value);
        return switch (type) {
            case "LIST_NODE" -> "__tr_build_list(" + raw + ")";
            case "TREE_NODE" -> "__tr_build_tree(" + raw + ")";
            default -> raw;
        };
    }

    private String pythonValue(JsonNode value) {
        if (value.isNull()) return "None";
        if (value.isBoolean()) return value.booleanValue() ? "True" : "False";
        if (value.isTextual()) return pythonString(value.textValue());
        if (value.isArray()) {
            List<String> values = new ArrayList<>();
            value.forEach(item -> values.add(pythonValue(item)));
            return "[" + String.join(", ", values) + "]";
        }
        return value.toString();
    }

    private String javaLiteral(JsonNode value, String type) {
        return switch (type) {
            case "INTEGER" -> value.toString();
            case "LONG" -> value + "L";
            case "DOUBLE" -> value.toString();
            case "BOOLEAN" -> value.toString();
            case "STRING" -> javaString(value.textValue());
            case "INTEGER_ARRAY" -> "new int[]{" + joined(value, JsonNode::toString) + "}";
            case "STRING_ARRAY" -> "new String[]{" + joined(value, item -> javaString(item.textValue())) + "}";
            case "INTEGER_MATRIX" -> "new int[][]{" + joined(value,
                row -> "new int[]{" + joined(row, JsonNode::toString) + "}") + "}";
            case "STRING_MATRIX" -> "new String[][]{" + joined(value,
                row -> "new String[]{" + joined(row, item -> javaString(item.textValue())) + "}") + "}";
            case "CHAR_MATRIX" -> "new char[][]{" + joined(value,
                row -> "new char[]{" + joined(row, item -> javaChar(item.textValue())) + "}") + "}";
            case "LIST_NODE" -> "Main.__trBuildList(new int[]{"
                + joined(value, JsonNode::toString) + "})";
            case "TREE_NODE" -> "Main.__trBuildTree(new Integer[]{"
                + joined(value, item -> item.isNull() ? "null" : item.toString()) + "})";
            default -> throw new IllegalArgumentException("Unsupported Java input type " + type);
        };
    }

    private String cppLiteral(JsonNode value, String type) {
        return switch (type) {
            case "INTEGER" -> value.toString();
            case "LONG" -> value + "LL";
            case "DOUBLE" -> value.toString();
            case "BOOLEAN" -> value.toString();
            case "STRING" -> cppString(value.textValue());
            case "INTEGER_ARRAY" -> "vector<int>{" + joined(value, JsonNode::toString) + "}";
            case "STRING_ARRAY" -> "vector<string>{" + joined(value, item -> cppString(item.textValue())) + "}";
            case "INTEGER_MATRIX" -> "vector<vector<int>>{" + joined(value,
                row -> "vector<int>{" + joined(row, JsonNode::toString) + "}") + "}";
            case "STRING_MATRIX" -> "vector<vector<string>>{" + joined(value,
                row -> "vector<string>{" + joined(row, item -> cppString(item.textValue())) + "}") + "}";
            case "CHAR_MATRIX" -> "vector<vector<char>>{" + joined(value,
                row -> "vector<char>{" + joined(row, item -> cppChar(item.textValue())) + "}") + "}";
            case "LIST_NODE" -> "__trBuildList(vector<int>{"
                + joined(value, JsonNode::toString) + "})";
            case "TREE_NODE" -> "__trBuildTree(vector<optional<int>>{"
                + joined(value, item -> item.isNull() ? "nullopt" : item.toString()) + "})";
            default -> throw new IllegalArgumentException("Unsupported C++ input type " + type);
        };
    }

    private String javaType(String type) {
        return switch (type) {
            case "INTEGER" -> "int";
            case "LONG" -> "long";
            case "DOUBLE" -> "double";
            case "BOOLEAN" -> "boolean";
            case "STRING" -> "String";
            case "INTEGER_ARRAY" -> "int[]";
            case "STRING_ARRAY" -> "String[]";
            case "INTEGER_MATRIX" -> "int[][]";
            case "STRING_MATRIX" -> "String[][]";
            case "CHAR_MATRIX" -> "char[][]";
            case "LIST_NODE" -> "ListNode";
            case "TREE_NODE" -> "TreeNode";
            default -> throw new IllegalArgumentException("Unsupported Java type " + type);
        };
    }

    private String cppType(String type) {
        return switch (type) {
            case "INTEGER" -> "int";
            case "LONG" -> "long long";
            case "DOUBLE" -> "double";
            case "BOOLEAN" -> "bool";
            case "STRING" -> "string";
            case "INTEGER_ARRAY" -> "vector<int>";
            case "STRING_ARRAY" -> "vector<string>";
            case "INTEGER_MATRIX" -> "vector<vector<int>>";
            case "STRING_MATRIX" -> "vector<vector<string>>";
            case "CHAR_MATRIX" -> "vector<vector<char>>";
            case "LIST_NODE" -> "ListNode*";
            case "TREE_NODE" -> "TreeNode*";
            default -> throw new IllegalArgumentException("Unsupported C++ type " + type);
        };
    }

    private boolean uses(ProblemExecutionSpec spec, String type) {
        return type.equals(spec.returnType()) || type.equals(spec.outputType())
            || spec.parameters().stream().anyMatch(parameter -> type.equals(parameter.type()));
    }

    private String joined(
        JsonNode array,
        java.util.function.Function<JsonNode, String> formatter
    ) {
        List<String> values = new ArrayList<>();
        array.forEach(item -> values.add(formatter.apply(item)));
        return String.join(",", values);
    }

    private String jsString(String value) {
        return quoteJson(value);
    }

    private String pythonString(String value) {
        return quoteJson(value);
    }

    private String javaString(String value) {
        return quoteJson(value)
            .replace("\u2028", "\\u2028")
            .replace("\u2029", "\\u2029");
    }

    private String cppString(String value) {
        return quoteJson(value);
    }

    private String javaChar(String value) {
        return "'" + escapeChar(value) + "'";
    }

    private String cppChar(String value) {
        return "'" + escapeChar(value) + "'";
    }

    private String escapeChar(String value) {
        if (value == null || value.length() != 1) {
            throw new IllegalArgumentException("Character test values must contain one character.");
        }
        return switch (value.charAt(0)) {
            case '\\' -> "\\\\";
            case '\'' -> "\\'";
            case '\n' -> "\\n";
            case '\r' -> "\\r";
            case '\t' -> "\\t";
            default -> value;
        };
    }

    private String quoteJson(String value) {
        try {
            return json.writeValueAsString(value);
        } catch (JacksonException exception) {
            throw new IllegalArgumentException("Could not encode a test value.", exception);
        }
    }

    private record ParsedTest(
        int order,
        ArrayNode inputs,
        String expectedCanonical,
        String inputsText
    ) {}
}
