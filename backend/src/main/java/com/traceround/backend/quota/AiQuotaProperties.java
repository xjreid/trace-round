package com.traceround.backend.quota;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "traceround.ai.quotas")
public class AiQuotaProperties {

    private boolean enabled = true;
    private int dailyUnits = 1000;
    private int maxMessagesPerQuestion = 6;
    private int ipInterviewsPerHour = 10;
    private int accountInterviewsPerHour = 20;
    private int ipMessagesPerMinute = 20;
    private int accountMessagesPerMinute = 30;
    private String hashSalt = "traceround-local-only";

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public int getDailyUnits() {
        return dailyUnits;
    }

    public void setDailyUnits(int dailyUnits) {
        this.dailyUnits = positive(dailyUnits, "daily-units");
    }

    public int getMaxMessagesPerQuestion() {
        return maxMessagesPerQuestion;
    }

    public void setMaxMessagesPerQuestion(int maxMessagesPerQuestion) {
        this.maxMessagesPerQuestion = positive(
            maxMessagesPerQuestion,
            "max-messages-per-question"
        );
    }

    public int getIpInterviewsPerHour() {
        return ipInterviewsPerHour;
    }

    public void setIpInterviewsPerHour(int ipInterviewsPerHour) {
        this.ipInterviewsPerHour = positive(
            ipInterviewsPerHour,
            "ip-interviews-per-hour"
        );
    }

    public int getAccountInterviewsPerHour() {
        return accountInterviewsPerHour;
    }

    public void setAccountInterviewsPerHour(int accountInterviewsPerHour) {
        this.accountInterviewsPerHour = positive(
            accountInterviewsPerHour,
            "account-interviews-per-hour"
        );
    }

    public int getIpMessagesPerMinute() {
        return ipMessagesPerMinute;
    }

    public void setIpMessagesPerMinute(int ipMessagesPerMinute) {
        this.ipMessagesPerMinute = positive(
            ipMessagesPerMinute,
            "ip-messages-per-minute"
        );
    }

    public int getAccountMessagesPerMinute() {
        return accountMessagesPerMinute;
    }

    public void setAccountMessagesPerMinute(int accountMessagesPerMinute) {
        this.accountMessagesPerMinute = positive(
            accountMessagesPerMinute,
            "account-messages-per-minute"
        );
    }

    public String getHashSalt() {
        return hashSalt;
    }

    public void setHashSalt(String hashSalt) {
        if (hashSalt == null || hashSalt.isBlank()) {
            throw new IllegalArgumentException("hash-salt must not be blank");
        }
        this.hashSalt = hashSalt;
    }

    private int positive(int value, String name) {
        if (value < 1) {
            throw new IllegalArgumentException(name + " must be positive");
        }
        return value;
    }
}
