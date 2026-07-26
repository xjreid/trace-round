package com.traceround.backend.problem;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.util.UUID;

@Entity
@Table(
    name = "problem_test_cases",
    uniqueConstraints = @UniqueConstraint(columnNames = {"problem_slug", "test_order"})
)
public class ProblemTestCase {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "problem_slug", nullable = false)
    private Problem problem;

    @Column(name = "test_order", nullable = false)
    private int testOrder;

    @Column(name = "inputs_json", nullable = false, columnDefinition = "text")
    private String inputsJson;

    @Column(name = "expected_json", nullable = false, columnDefinition = "text")
    private String expectedJson;

    protected ProblemTestCase() {
    }

    public int getTestOrder() {
        return testOrder;
    }

    public String getInputsJson() {
        return inputsJson;
    }

    public String getExpectedJson() {
        return expectedJson;
    }
}
