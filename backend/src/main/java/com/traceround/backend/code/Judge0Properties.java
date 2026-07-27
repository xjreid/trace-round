package com.traceround.backend.code;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "traceround.code-execution.judge0")
public class Judge0Properties {

    private String baseUrl = "https://judge0-ce.p.rapidapi.com";
    private String apiKey = "";
    private String apiHost = "judge0-ce.p.rapidapi.com";
    private String authMode = "rapidapi";
    private int pollIntervalMillis = 350;
    private int pollTimeoutSeconds = 12;
    private int cpuTimeLimitSeconds = 5;
    private int maxOutputCharacters = 32768;
    private int javascriptLanguageId = 63;
    private int pythonLanguageId = 71;
    private int javaLanguageId = 62;
    private int cppLanguageId = 54;

    public String getBaseUrl() { return baseUrl; }
    public void setBaseUrl(String baseUrl) { this.baseUrl = required(baseUrl, "base-url"); }
    public String getApiKey() { return apiKey; }
    public void setApiKey(String apiKey) { this.apiKey = apiKey == null ? "" : apiKey.trim(); }
    public String getApiHost() { return apiHost; }
    public void setApiHost(String apiHost) { this.apiHost = apiHost == null ? "" : apiHost.trim(); }
    public String getAuthMode() { return authMode; }
    public void setAuthMode(String authMode) { this.authMode = required(authMode, "auth-mode"); }
    public int getPollIntervalMillis() { return pollIntervalMillis; }
    public void setPollIntervalMillis(int value) { pollIntervalMillis = positive(value, "poll-interval-millis"); }
    public int getPollTimeoutSeconds() { return pollTimeoutSeconds; }
    public void setPollTimeoutSeconds(int value) { pollTimeoutSeconds = positive(value, "poll-timeout-seconds"); }
    public int getCpuTimeLimitSeconds() { return cpuTimeLimitSeconds; }
    public void setCpuTimeLimitSeconds(int value) { cpuTimeLimitSeconds = positive(value, "cpu-time-limit-seconds"); }
    public int getMaxOutputCharacters() { return maxOutputCharacters; }
    public void setMaxOutputCharacters(int value) { maxOutputCharacters = positive(value, "max-output-characters"); }
    public int getJavascriptLanguageId() { return javascriptLanguageId; }
    public void setJavascriptLanguageId(int value) { javascriptLanguageId = positive(value, "javascript-language-id"); }
    public int getPythonLanguageId() { return pythonLanguageId; }
    public void setPythonLanguageId(int value) { pythonLanguageId = positive(value, "python-language-id"); }
    public int getJavaLanguageId() { return javaLanguageId; }
    public void setJavaLanguageId(int value) { javaLanguageId = positive(value, "java-language-id"); }
    public int getCppLanguageId() { return cppLanguageId; }
    public void setCppLanguageId(int value) { cppLanguageId = positive(value, "cpp-language-id"); }

    public int languageId(String language) {
        return switch (language) {
            case "JavaScript" -> javascriptLanguageId;
            case "Python" -> pythonLanguageId;
            case "Java" -> javaLanguageId;
            case "C++" -> cppLanguageId;
            default -> throw new IllegalArgumentException(
                language + " is not enabled by TraceRound."
            );
        };
    }

    private String required(String value, String name) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(name + " must not be blank");
        }
        return value.trim();
    }

    private int positive(int value, String name) {
        if (value < 1) throw new IllegalArgumentException(name + " must be positive");
        return value;
    }
}
