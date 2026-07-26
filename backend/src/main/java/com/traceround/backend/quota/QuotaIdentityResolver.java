package com.traceround.backend.quota;

import com.traceround.backend.user.AppUser;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import org.springframework.stereotype.Component;

@Component
public class QuotaIdentityResolver {

    private final String salt;

    public QuotaIdentityResolver(AiQuotaProperties properties) {
        this.salt = properties.getHashSalt();
    }

    public QuotaIdentity resolve(String remoteAddress, AppUser user) {
        String address = remoteAddress == null || remoteAddress.isBlank()
            ? "unknown"
            : remoteAddress;
        return new QuotaIdentity(
            hash("ip:" + address),
            user == null ? null : hash("account:" + user.getId())
        );
    }

    private String hash(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] result = digest.digest(
                (salt + ":" + value).getBytes(StandardCharsets.UTF_8)
            );
            return java.util.HexFormat.of().formatHex(result);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is unavailable.", exception);
        }
    }
}
