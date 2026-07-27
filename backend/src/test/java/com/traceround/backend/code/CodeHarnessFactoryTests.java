package com.traceround.backend.code;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.traceround.backend.code.CodeExecutionClient.CodeExecutionResult;
import com.traceround.backend.code.CodeExecutionClient.TestCase;
import com.traceround.backend.problem.ProblemExecutionSpec;
import com.traceround.backend.problem.ProblemExecutionSpec.Parameter;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import tools.jackson.databind.ObjectMapper;

class CodeHarnessFactoryTests {

    private final CodeHarnessFactory harnesses =
        new CodeHarnessFactory(new ObjectMapper());

    @TempDir
    Path temporaryDirectory;

    @Test
    void buildsAllFourLanguagesAsOneMultiTestSubmission() {
        ProblemExecutionSpec spec = new ProblemExecutionSpec(
            "twoSum",
            List.of(
                new Parameter("nums", "INTEGER_ARRAY"),
                new Parameter("target", "INTEGER")
            ),
            "INTEGER_ARRAY",
            "RETURN",
            null,
            "INTEGER_ARRAY",
            "UNORDERED_TOP"
        );
        List<TestCase> tests = List.of(
            new TestCase(1, "[[2,7,11,15],9]", "[0,1]"),
            new TestCase(2, "[[3,2,4],6]", "[1,2]")
        );

        for (String language : List.of("JavaScript", "Python", "Java", "C++")) {
            String source = harnesses.build(
                language,
                solution(language, "twoSum"),
                spec,
                tests
            );
            assertTrue(source.contains("__TRACEROUND_RESULT__|2|2|passed"));
            assertTrue(source.contains("twoSum"));
            assertTrue(source.contains("[[2,7,11,15],9]"));
            assertTrue(source.contains("[[3,2,4],6]"));
            assertFalse(source.contains("{{"));
        }
    }

    @Test
    void supportsLinkedListsTreesAndMutatedArguments() {
        ProblemExecutionSpec listSpec = new ProblemExecutionSpec(
            "reverseList",
            List.of(new Parameter("head", "LIST_NODE")),
            "LIST_NODE",
            "RETURN",
            null,
            "LIST_NODE",
            "EXACT"
        );
        String cpp = harnesses.build(
            "C++",
            solution("C++", "reverseList"),
            listSpec,
            List.of(new TestCase(1, "[[1,2,3]]", "[3,2,1]"))
        );
        assertTrue(cpp.contains("__trBuildList(vector<int>{1,2,3})"));
        assertTrue(cpp.contains("__trListToVector"));

        ProblemExecutionSpec treeSpec = new ProblemExecutionSpec(
            "levelOrder",
            List.of(new Parameter("root", "TREE_NODE")),
            "INTEGER_MATRIX",
            "RETURN",
            null,
            "INTEGER_MATRIX",
            "EXACT"
        );
        String java = harnesses.build(
            "Java",
            solution("Java", "levelOrder"),
            treeSpec,
            List.of(new TestCase(1, "[[3,9,20,null,null,15,7]]", "[[3],[9,20],[15,7]]"))
        );
        assertTrue(java.contains("new Integer[]{3,9,20,null,null,15,7}"));
        assertTrue(java.contains("__trBuildTree"));

        ProblemExecutionSpec mutateSpec = new ProblemExecutionSpec(
            "sortColors",
            List.of(new Parameter("nums", "INTEGER_ARRAY")),
            "VOID",
            "ARGUMENT",
            0,
            "INTEGER_ARRAY",
            "EXACT"
        );
        String python = harnesses.build(
            "Python",
            solution("Python", "sortColors"),
            mutateSpec,
            List.of(new TestCase(1, "[[2,0,1]]", "[0,1,2]"))
        );
        assertTrue(python.contains("__tr_actual = __tr_arg_0_0"));
    }

    @Test
    void parsesPassAndFirstFailureMarkers() {
        CodeExecutionResult passed = CodeHarnessResultParser.parse(
            "noise\n__TRACEROUND_RESULT__|3|3|passed\n",
            3
        );
        assertNotNull(passed);
        assertEquals("success", passed.status());
        assertEquals(3, passed.passedTests());

        CodeExecutionResult failed = CodeHarnessResultParser.parse(
            "__TRACEROUND_DETAIL__\nTest 2 failed\nInput: [1]\nExpected: 2\nActual: 1\n"
                + "__TRACEROUND_RESULT__|1|3|failed\n",
            3
        );
        assertNotNull(failed);
        assertEquals("Test case failed", failed.summary());
        assertTrue(failed.output().startsWith("Test 2 failed"));
        assertEquals(1, failed.passedTests());
        assertNull(CodeHarnessResultParser.parse("ordinary program output", 3));
    }

    @Test
    void generatedHarnessesCompileAndPassInAllFourRuntimes() throws Exception {
        ProblemExecutionSpec spec = new ProblemExecutionSpec(
            "identity",
            List.of(new Parameter("value", "INTEGER")),
            "INTEGER",
            "RETURN",
            null,
            "INTEGER",
            "EXACT"
        );
        List<TestCase> tests = List.of(
            new TestCase(1, "[1]", "1"),
            new TestCase(2, "[-7]", "-7")
        );

        verifyRuntime(
            "solution.js",
            harnesses.build(
                "JavaScript",
                "class Solution { identity(value) { return value; } }",
                spec,
                tests
            ),
            List.of("node", "solution.js")
        );
        verifyRuntime(
            "solution.py",
            harnesses.build(
                "Python",
                "class Solution:\n    def identity(self, value):\n        return value",
                spec,
                tests
            ),
            List.of("python3", "solution.py")
        );
        verifyRuntime(
            "Main.java",
            harnesses.build(
                "Java",
                "class Solution { int identity(int value) { return value; } }",
                spec,
                tests
            ),
            List.of("sh", "-c", "javac Main.java && java Main")
        );
        verifyRuntime(
            "solution.cpp",
            harnesses.build(
                "C++",
                "class Solution { public: int identity(int value) { return value; } };",
                spec,
                tests
            ),
            List.of("sh", "-c", "g++ -std=c++17 solution.cpp -o solution && ./solution")
        );
    }

    private String solution(String language, String method) {
        return switch (language) {
            case "JavaScript" -> "class Solution { " + method + "() {} }";
            case "Python" -> "class Solution:\n    def " + method + "(self):\n        pass";
            case "Java" -> "class Solution { Object " + method + "() { return null; } }";
            case "C++" -> "class Solution { public: int " + method + "() { return 0; } };";
            default -> throw new IllegalArgumentException(language);
        };
    }

    private void verifyRuntime(
        String fileName,
        String source,
        List<String> command
    ) throws Exception {
        Path runtimeDirectory = Files.createDirectory(
            temporaryDirectory.resolve(fileName.replace('.', '-'))
        );
        Files.writeString(runtimeDirectory.resolve(fileName), source);
        Process process = new ProcessBuilder(command)
            .directory(runtimeDirectory.toFile())
            .redirectErrorStream(true)
            .start();
        assertTrue(process.waitFor(10, TimeUnit.SECONDS), fileName + " timed out");
        String output = new String(process.getInputStream().readAllBytes());
        assertEquals(0, process.exitValue(), fileName + " failed:\n" + output);
        assertTrue(
            output.contains("__TRACEROUND_RESULT__|2|2|passed"),
            fileName + " did not report passing tests:\n" + output
        );
    }
}
