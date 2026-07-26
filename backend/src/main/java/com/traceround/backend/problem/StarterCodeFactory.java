package com.traceround.backend.problem;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;

@Component
public class StarterCodeFactory {

    public Map<String, String> create(ProblemExecutionSpec spec) {
        Map<String, String> code = new LinkedHashMap<>();
        code.put("Python", python(spec));
        code.put("Java", java(spec));
        code.put("C++", cpp(spec));
        code.put("JavaScript", javascript(spec));
        return code;
    }

    private String python(ProblemExecutionSpec spec) {
        StringBuilder code = new StringBuilder();
        if (uses(spec, "LIST_NODE")) {
            code.append("""
                class ListNode:
                    def __init__(self, val=0, next=None):
                        self.val = val
                        self.next = next

                """);
        }
        if (uses(spec, "TREE_NODE")) {
            code.append("""
                class TreeNode:
                    def __init__(self, val=0, left=None, right=None):
                        self.val = val
                        self.left = left
                        self.right = right

                """);
        }
        String parameters = spec.parameters().stream()
            .map(parameter ->
                parameter.name() + ": " + pythonType(parameter.type())
            )
            .collect(Collectors.joining(", "));
        code.append("class Solution:\n")
            .append("    def ").append(spec.method()).append("(self");
        if (!parameters.isEmpty()) {
            code.append(", ").append(parameters);
        }
        code.append(") -> ").append(pythonType(spec.returnType())).append(":\n")
            .append("        # Write your solution here.\n")
            .append("        ").append(pythonDefault(spec.returnType())).append("\n");
        return code.toString();
    }

    private String java(ProblemExecutionSpec spec) {
        StringBuilder code = new StringBuilder("import java.util.*;\n\n");
        if (uses(spec, "LIST_NODE")) {
            code.append("""
                class ListNode {
                    int val;
                    ListNode next;

                    ListNode(int val) {
                        this.val = val;
                    }
                }

                """);
        }
        if (uses(spec, "TREE_NODE")) {
            code.append("""
                class TreeNode {
                    int val;
                    TreeNode left;
                    TreeNode right;

                    TreeNode(int val) {
                        this.val = val;
                    }
                }

                """);
        }
        String parameters = spec.parameters().stream()
            .map(parameter ->
                javaType(parameter.type()) + " " + parameter.name()
            )
            .collect(Collectors.joining(", "));
        code.append("class Solution {\n")
            .append("    public ").append(javaType(spec.returnType()))
            .append(" ").append(spec.method()).append("(").append(parameters)
            .append(") {\n")
            .append("        // Write your solution here.\n");
        if (!"VOID".equals(spec.returnType())) {
            code.append("        return ").append(javaDefault(spec.returnType()))
                .append(";\n");
        }
        code.append("    }\n}\n");
        return code.toString();
    }

    private String cpp(ProblemExecutionSpec spec) {
        StringBuilder code = new StringBuilder("""
            #include <algorithm>
            #include <cmath>
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

            """);
        if (uses(spec, "LIST_NODE")) {
            code.append("""
                struct ListNode {
                    int val;
                    ListNode* next;
                    ListNode(int value) : val(value), next(nullptr) {}
                };

                """);
        }
        if (uses(spec, "TREE_NODE")) {
            code.append("""
                struct TreeNode {
                    int val;
                    TreeNode* left;
                    TreeNode* right;
                    TreeNode(int value) : val(value), left(nullptr), right(nullptr) {}
                };

                """);
        }
        String parameters = spec.parameters().stream()
            .map(parameter ->
                cppType(parameter.type(), true) + " " + parameter.name()
            )
            .collect(Collectors.joining(", "));
        code.append("class Solution {\npublic:\n")
            .append("    ").append(cppType(spec.returnType(), false))
            .append(" ").append(spec.method()).append("(").append(parameters)
            .append(") {\n")
            .append("        // Write your solution here.\n");
        if (!"VOID".equals(spec.returnType())) {
            code.append("        return ").append(cppDefault(spec.returnType()))
                .append(";\n");
        }
        code.append("    }\n};\n");
        return code.toString();
    }

    private String javascript(ProblemExecutionSpec spec) {
        StringBuilder code = new StringBuilder();
        if (uses(spec, "LIST_NODE")) {
            code.append("""
                class ListNode {
                  constructor(val = 0, next = null) {
                    this.val = val
                    this.next = next
                  }
                }

                """);
        }
        if (uses(spec, "TREE_NODE")) {
            code.append("""
                class TreeNode {
                  constructor(val = 0, left = null, right = null) {
                    this.val = val
                    this.left = left
                    this.right = right
                  }
                }

                """);
        }
        String parameters = spec.parameters().stream()
            .map(ProblemExecutionSpec.Parameter::name)
            .collect(Collectors.joining(", "));
        code.append("class Solution {\n")
            .append("  ").append(spec.method()).append("(").append(parameters)
            .append(") {\n")
            .append("    // Write your solution here.\n");
        if (!"VOID".equals(spec.returnType())) {
            code.append("    return ").append(javascriptDefault(spec.returnType()))
                .append("\n");
        }
        code.append("  }\n}\n");
        return code.toString();
    }

    private boolean uses(ProblemExecutionSpec spec, String type) {
        return type.equals(spec.returnType())
            || type.equals(spec.outputType())
            || spec.parameters().stream().anyMatch(parameter ->
                type.equals(parameter.type())
            );
    }

    private String pythonType(String type) {
        return switch (type) {
            case "INTEGER", "LONG" -> "int";
            case "DOUBLE" -> "float";
            case "BOOLEAN" -> "bool";
            case "STRING" -> "str";
            case "INTEGER_ARRAY" -> "list[int]";
            case "STRING_ARRAY" -> "list[str]";
            case "INTEGER_MATRIX" -> "list[list[int]]";
            case "STRING_MATRIX" -> "list[list[str]]";
            case "CHAR_MATRIX" -> "list[list[str]]";
            case "LIST_NODE" -> "ListNode";
            case "TREE_NODE" -> "TreeNode";
            case "VOID" -> "None";
            default -> throw unsupported(type);
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
            case "VOID" -> "void";
            default -> throw unsupported(type);
        };
    }

    private String cppType(String type, boolean parameter) {
        String base = switch (type) {
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
            case "VOID" -> "void";
            default -> throw unsupported(type);
        };
        boolean reference = parameter && (
            type.endsWith("_ARRAY")
                || type.endsWith("_MATRIX")
                || "STRING".equals(type)
        );
        return reference ? base + "&" : base;
    }

    private String pythonDefault(String type) {
        return switch (type) {
            case "INTEGER", "LONG" -> "return 0";
            case "DOUBLE" -> "return 0.0";
            case "BOOLEAN" -> "return False";
            case "STRING" -> "return \"\"";
            case "INTEGER_ARRAY", "STRING_ARRAY", "INTEGER_MATRIX",
                "STRING_MATRIX", "CHAR_MATRIX" -> "return []";
            case "LIST_NODE", "TREE_NODE" -> "return None";
            case "VOID" -> "pass";
            default -> throw unsupported(type);
        };
    }

    private String javaDefault(String type) {
        return switch (type) {
            case "INTEGER", "LONG" -> "0";
            case "DOUBLE" -> "0.0";
            case "BOOLEAN" -> "false";
            case "STRING" -> "\"\"";
            case "INTEGER_ARRAY" -> "new int[0]";
            case "STRING_ARRAY" -> "new String[0]";
            case "INTEGER_MATRIX" -> "new int[0][0]";
            case "STRING_MATRIX" -> "new String[0][0]";
            case "CHAR_MATRIX" -> "new char[0][0]";
            case "LIST_NODE", "TREE_NODE" -> "null";
            default -> throw unsupported(type);
        };
    }

    private String cppDefault(String type) {
        return switch (type) {
            case "INTEGER", "LONG" -> "0";
            case "DOUBLE" -> "0.0";
            case "BOOLEAN" -> "false";
            case "STRING" -> "\"\"";
            case "INTEGER_ARRAY", "STRING_ARRAY", "INTEGER_MATRIX",
                "STRING_MATRIX", "CHAR_MATRIX" -> "{}";
            case "LIST_NODE", "TREE_NODE" -> "nullptr";
            default -> throw unsupported(type);
        };
    }

    private String javascriptDefault(String type) {
        return switch (type) {
            case "INTEGER", "LONG", "DOUBLE" -> "0";
            case "BOOLEAN" -> "false";
            case "STRING" -> "''";
            case "INTEGER_ARRAY", "STRING_ARRAY", "INTEGER_MATRIX",
                "STRING_MATRIX", "CHAR_MATRIX" -> "[]";
            case "LIST_NODE", "TREE_NODE" -> "null";
            default -> throw unsupported(type);
        };
    }

    private IllegalArgumentException unsupported(String type) {
        return new IllegalArgumentException("Unsupported execution type: " + type);
    }
}
