package com.traceround.backend.quota;

import java.time.ZoneId;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "traceround.code-execution.quotas")
public class CodeExecutionQuotaProperties {

    private boolean enabled = true;
    private int dailySubmissions = 45;
    private int jdoodleDailySubmissions = 18;
    private int ipSubmissionsPerDay = 20;
    private int accountSubmissionsPerDay = 30;
    private int ipSubmissionsPerMinute = 5;
    private int accountSubmissionsPerMinute = 10;
    private String resetZone = "UTC";

    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }
    public int getDailySubmissions() { return dailySubmissions; }
    public void setDailySubmissions(int value) { dailySubmissions = positive(value, "daily-submissions"); }
    public int getJdoodleDailySubmissions() { return jdoodleDailySubmissions; }
    public void setJdoodleDailySubmissions(int value) {
        jdoodleDailySubmissions = positive(value, "jdoodle-daily-submissions");
    }
    public int getIpSubmissionsPerDay() { return ipSubmissionsPerDay; }
    public void setIpSubmissionsPerDay(int value) { ipSubmissionsPerDay = positive(value, "ip-submissions-per-day"); }
    public int getAccountSubmissionsPerDay() { return accountSubmissionsPerDay; }
    public void setAccountSubmissionsPerDay(int value) { accountSubmissionsPerDay = positive(value, "account-submissions-per-day"); }
    public int getIpSubmissionsPerMinute() { return ipSubmissionsPerMinute; }
    public void setIpSubmissionsPerMinute(int value) { ipSubmissionsPerMinute = positive(value, "ip-submissions-per-minute"); }
    public int getAccountSubmissionsPerMinute() { return accountSubmissionsPerMinute; }
    public void setAccountSubmissionsPerMinute(int value) { accountSubmissionsPerMinute = positive(value, "account-submissions-per-minute"); }
    public String getResetZone() { return resetZone; }
    public void setResetZone(String resetZone) {
        if (resetZone == null || resetZone.isBlank()) {
            throw new IllegalArgumentException("reset-zone must not be blank");
        }
        this.resetZone = ZoneId.of(resetZone.trim()).getId();
    }

    private int positive(int value, String name) {
        if (value < 1) throw new IllegalArgumentException(name + " must be positive");
        return value;
    }
}
