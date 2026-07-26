package com.traceround.backend.problem;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Column;

@Entity
@Table(name = "problems")
public class Problem {

    @Id
    private String slug;
    private String title;
    private String difficulty;
    private String category;
    @Column(columnDefinition = "text")
    private String description;
    private boolean enabled;
    @Column(name = "execution_spec", columnDefinition = "text")
    private String executionSpec;

    protected Problem() {
    }

    public String getSlug() {
        return slug;
    }

    public String getTitle() {
        return title;
    }

    public String getDifficulty() {
        return difficulty;
    }

    public String getCategory() {
        return category;
    }

    public String getDescription() {
        return description;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public String getExecutionSpec() {
        return executionSpec;
    }
}
