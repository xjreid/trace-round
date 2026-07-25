package com.traceround.backend.submission;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface QuestionFeedbackRepository extends JpaRepository<QuestionFeedback, UUID> {
}
