package com.traceround.backend.code;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

final class CodeHarnessResultParser {

    static final String RESULT_MARKER = "__TRACEROUND_RESULT__";
    static final String DETAIL_MARKER = "__TRACEROUND_DETAIL__";
    private static final Pattern RESULT = Pattern.compile(
        Pattern.quote(RESULT_MARKER) + "\\|(\\d+)\\|(\\d+)\\|(passed|failed)"
    );

    private CodeHarnessResultParser() {}

    static CodeExecutionClient.CodeExecutionResult parse(
        String combined,
        int fallbackTotal
    ) {
        Matcher matcher = RESULT.matcher(combined);
        String passedValue = null;
        String totalValue = null;
        String statusValue = null;
        while (matcher.find()) {
            passedValue = matcher.group(1);
            totalValue = matcher.group(2);
            statusValue = matcher.group(3);
        }
        if (passedValue == null) return null;

        int passed = Integer.parseInt(passedValue);
        int total = Integer.parseInt(totalValue);
        boolean success = "passed".equals(statusValue);
        String output;
        if (success) {
            output = "All " + total + " test cases passed.";
        } else {
            int detailIndex = combined.lastIndexOf(DETAIL_MARKER);
            int resultIndex = combined.lastIndexOf(RESULT_MARKER);
            int start = detailIndex >= 0
                ? detailIndex + DETAIL_MARKER.length()
                : 0;
            output = combined.substring(start, Math.max(start, resultIndex)).trim();
            if (output.isBlank()) output = "The solution did not produce a test result.";
        }
        return new CodeExecutionClient.CodeExecutionResult(
            success ? "success" : "error",
            success ? "All tests passed" : "Test case failed",
            output,
            passed,
            total > 0 ? total : fallbackTotal
        );
    }
}
