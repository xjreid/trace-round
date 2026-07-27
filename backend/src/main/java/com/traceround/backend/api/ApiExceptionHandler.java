package com.traceround.backend.api;

import com.traceround.backend.ai.AiProviderException;
import com.traceround.backend.quota.AiQuotaExceededException;
import com.traceround.backend.quota.CodeExecutionQuotaExceededException;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(AiQuotaExceededException.class)
    ResponseEntity<Map<String, String>> aiQuota(AiQuotaExceededException exception) {
        ResponseEntity.BodyBuilder response = ResponseEntity
            .status(HttpStatus.TOO_MANY_REQUESTS);
        if (exception.getRetryAt() != null) {
            long retrySeconds = Math.max(
                1,
                Duration.between(Instant.now(), exception.getRetryAt()).toSeconds()
            );
            response.header("Retry-After", Long.toString(retrySeconds));
        }
        return response.body(Map.of(
            "error", exception.getMessage(),
            "code", exception.getCode()
        ));
    }

    @ExceptionHandler(CodeExecutionQuotaExceededException.class)
    ResponseEntity<Map<String, String>> codeQuota(
        CodeExecutionQuotaExceededException exception
    ) {
        ResponseEntity.BodyBuilder response = ResponseEntity
            .status(HttpStatus.TOO_MANY_REQUESTS);
        if (exception.getRetryAt() != null) {
            long retrySeconds = Math.max(
                1,
                Duration.between(Instant.now(), exception.getRetryAt()).toSeconds()
            );
            response.header("Retry-After", Long.toString(retrySeconds));
        }
        return response.body(Map.of(
            "error", exception.getMessage(),
            "code", exception.getCode()
        ));
    }

    @ExceptionHandler(AiProviderException.class)
    ResponseEntity<Map<String, String>> aiProvider(AiProviderException exception) {
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
            .body(Map.of("error", exception.getMessage()));
    }

    @ExceptionHandler(BadCredentialsException.class)
    ResponseEntity<Map<String, String>> badCredentials() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
            .body(Map.of("error", "Invalid email or password."));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<Map<String, String>> invalidRequest(
        MethodArgumentNotValidException exception
    ) {
        String message = exception.getBindingResult().getFieldErrors().stream()
            .findFirst()
            .map(error -> error.getField() + " " + error.getDefaultMessage())
            .orElse("The request is invalid.");
        return ResponseEntity.badRequest().body(Map.of("error", message));
    }
}
