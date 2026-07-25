package com.traceround.backend.auth;

import com.traceround.backend.user.AppUser;
import com.traceround.backend.user.AppUserRepository;
import com.traceround.backend.user.OAuthIdentity;
import com.traceround.backend.user.OAuthIdentityRepository;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class CurrentUserService {

    private final AppUserRepository users;
    private final OAuthIdentityRepository identities;

    public CurrentUserService(
        AppUserRepository users,
        OAuthIdentityRepository identities
    ) {
        this.users = users;
        this.identities = identities;
    }

    @Transactional
    public Optional<AppUser> find(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return Optional.empty();
        }

        if (authentication.getPrincipal() instanceof AppUserPrincipal principal) {
            return users.findById(principal.userId());
        }

        if (authentication instanceof OAuth2AuthenticationToken oauth) {
            return Optional.of(resolveOAuthUser(oauth));
        }

        return Optional.empty();
    }

    public AppUser require(Authentication authentication) {
        return find(authentication).orElseThrow(() ->
            new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "An authenticated session is required."
            )
        );
    }

    private AppUser resolveOAuthUser(OAuth2AuthenticationToken authentication) {
        String provider = authentication.getAuthorizedClientRegistrationId();
        Map<String, Object> attributes = authentication.getPrincipal().getAttributes();
        String subject = firstString(attributes, "sub", "id");
        String email = firstString(
            attributes,
            "email",
            "mail"
        );
        String name = firstString(attributes, "name", "login", "displayName");

        if (subject == null) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "The OAuth provider did not return a stable account identifier."
            );
        }

        Optional<OAuthIdentity> existing =
            identities.findByProviderAndProviderSubject(provider, subject);
        if (existing.isPresent()) {
            return existing.get().getUser();
        }

        if (email == null || !hasAcceptableEmail(provider, attributes)) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "The OAuth provider did not return a verified email address."
            );
        }

        String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);
        AppUser user = users.findByEmailIgnoreCase(normalizedEmail)
            .orElseGet(() -> users.save(new AppUser(
                normalizedEmail,
                name == null || name.isBlank() ? normalizedEmail : name,
                null
            )));
        identities.save(new OAuthIdentity(user, provider, subject));
        return user;
    }

    private boolean hasAcceptableEmail(
        String provider,
        Map<String, Object> attributes
    ) {
        if (!"google".equals(provider) && !"github".equals(provider)) {
            return false;
        }
        Object verified = attributes.get("email_verified");
        return Boolean.TRUE.equals(verified)
            || "true".equalsIgnoreCase(String.valueOf(verified));
    }

    private String firstString(Map<String, Object> attributes, String... keys) {
        for (String key : keys) {
            Object value = attributes.get(key);
            if (value != null && !value.toString().isBlank()) {
                return value.toString();
            }
        }
        return null;
    }
}
