package com.traceround.backend.code;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "traceround.code-execution.jdoodle")
public class JdoodleProperties {

    private String baseUrl = "https://api.jdoodle.com/v1";
    private String clientId = "";
    private String clientSecret = "";
    private int maxOutputCharacters = 32768;
    private String javascriptLanguage = "nodejs";
    private String javascriptVersionIndex = "5";
    private String pythonLanguage = "python3";
    private String pythonVersionIndex = "5";
    private String javaLanguage = "java";
    private String javaVersionIndex = "5";
    private String cppLanguage = "cpp17";
    private String cppVersionIndex = "2";

    public String getBaseUrl() { return baseUrl; }
    public void setBaseUrl(String value) { baseUrl = required(value, "base-url"); }
    public String getClientId() { return clientId; }
    public void setClientId(String value) { clientId = optional(value); }
    public String getClientSecret() { return clientSecret; }
    public void setClientSecret(String value) { clientSecret = optional(value); }
    public int getMaxOutputCharacters() { return maxOutputCharacters; }
    public void setMaxOutputCharacters(int value) {
        if (value < 1) throw new IllegalArgumentException(
            "max-output-characters must be positive"
        );
        maxOutputCharacters = value;
    }
    public String getJavascriptLanguage() { return javascriptLanguage; }
    public void setJavascriptLanguage(String value) { javascriptLanguage = required(value, "javascript-language"); }
    public String getJavascriptVersionIndex() { return javascriptVersionIndex; }
    public void setJavascriptVersionIndex(String value) { javascriptVersionIndex = required(value, "javascript-version-index"); }
    public String getPythonLanguage() { return pythonLanguage; }
    public void setPythonLanguage(String value) { pythonLanguage = required(value, "python-language"); }
    public String getPythonVersionIndex() { return pythonVersionIndex; }
    public void setPythonVersionIndex(String value) { pythonVersionIndex = required(value, "python-version-index"); }
    public String getJavaLanguage() { return javaLanguage; }
    public void setJavaLanguage(String value) { javaLanguage = required(value, "java-language"); }
    public String getJavaVersionIndex() { return javaVersionIndex; }
    public void setJavaVersionIndex(String value) { javaVersionIndex = required(value, "java-version-index"); }
    public String getCppLanguage() { return cppLanguage; }
    public void setCppLanguage(String value) { cppLanguage = required(value, "cpp-language"); }
    public String getCppVersionIndex() { return cppVersionIndex; }
    public void setCppVersionIndex(String value) { cppVersionIndex = required(value, "cpp-version-index"); }

    public Runtime runtime(String language) {
        return switch (language) {
            case "JavaScript" -> new Runtime(
                javascriptLanguage,
                javascriptVersionIndex
            );
            case "Python" -> new Runtime(pythonLanguage, pythonVersionIndex);
            case "Java" -> new Runtime(javaLanguage, javaVersionIndex);
            case "C++" -> new Runtime(cppLanguage, cppVersionIndex);
            default -> throw new IllegalArgumentException(
                language + " is not enabled by TraceRound."
            );
        };
    }

    private String optional(String value) {
        return value == null ? "" : value.trim();
    }

    private String required(String value, String name) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(name + " must not be blank");
        }
        return value.trim();
    }

    public record Runtime(String language, String versionIndex) {}
}
