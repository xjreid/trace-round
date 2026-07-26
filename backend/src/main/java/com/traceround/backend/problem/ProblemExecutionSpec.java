package com.traceround.backend.problem;

import java.util.List;

public record ProblemExecutionSpec(
    String method,
    List<Parameter> parameters,
    String returnType,
    String resultMode,
    Integer resultArgumentIndex,
    String outputType,
    String comparison
) {
    public ProblemExecutionSpec {
        parameters = List.copyOf(parameters);
        resultMode = resultMode == null ? "RETURN" : resultMode;
        outputType = outputType == null ? returnType : outputType;
        comparison = comparison == null ? "EXACT" : comparison;
    }

    public record Parameter(String name, String type) {
    }
}
