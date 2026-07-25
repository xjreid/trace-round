package com.traceround.backend.auth;

import com.traceround.backend.user.AppUser;
import com.traceround.backend.user.AppUserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AppUserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final CurrentUserService currentUsers;
    private final ObjectProvider<ClientRegistrationRepository> registrations;
    private final HttpSessionSecurityContextRepository contextRepository =
        new HttpSessionSecurityContextRepository();

    public AuthController(
        AppUserRepository users,
        PasswordEncoder passwordEncoder,
        AuthenticationManager authenticationManager,
        CurrentUserService currentUsers,
        ObjectProvider<ClientRegistrationRepository> registrations
    ) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.currentUsers = currentUsers;
        this.registrations = registrations;
    }

    @GetMapping("/csrf")
    public Map<String, String> csrf(CsrfToken token) {
        return Map.of(
            "token", token.getToken(),
            "headerName", token.getHeaderName()
        );
    }

    @GetMapping("/capabilities")
    public Map<String, Object> capabilities() {
        List<String> providers = new ArrayList<>();
        ClientRegistrationRepository repository = registrations.getIfAvailable();
        if (repository instanceof Iterable<?> iterable) {
            for (Object registration : iterable) {
                if (registration instanceof ClientRegistration client) {
                    providers.add(client.getRegistrationId());
                }
            }
        }
        return Map.of("password", true, "oauthProviders", providers);
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse register(
        @Valid @RequestBody RegisterRequest request,
        HttpServletRequest servletRequest,
        HttpServletResponse servletResponse
    ) {
        String email = request.email().trim().toLowerCase();
        if (users.existsByEmailIgnoreCase(email)) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "An account already exists for this email."
            );
        }

        AppUser user = users.save(new AppUser(
            email,
            request.name().trim(),
            passwordEncoder.encode(request.password())
        ));
        Authentication authenticated = authenticationManager.authenticate(
            UsernamePasswordAuthenticationToken.unauthenticated(email, request.password())
        );
        saveAuthentication(authenticated, servletRequest, servletResponse);
        return UserResponse.password(user);
    }

    @PostMapping("/login")
    public UserResponse login(
        @Valid @RequestBody LoginRequest request,
        HttpServletRequest servletRequest,
        HttpServletResponse servletResponse
    ) {
        Authentication authenticated = authenticationManager.authenticate(
            UsernamePasswordAuthenticationToken.unauthenticated(
                request.email().trim().toLowerCase(),
                request.password()
            )
        );
        saveAuthentication(authenticated, servletRequest, servletResponse);
        return UserResponse.password(currentUsers.require(authenticated));
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(HttpServletRequest request) {
        SecurityContextHolder.clearContext();
        if (request.getSession(false) != null) {
            request.getSession(false).invalidate();
        }
    }

    @GetMapping("/me")
    public UserResponse me(Authentication authentication) {
        AppUser user = currentUsers.find(authentication).orElseThrow(() ->
            new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not signed in.")
        );
        String provider = authentication instanceof OAuth2AuthenticationToken oauth
            ? oauth.getAuthorizedClientRegistrationId()
            : "password";
        return UserResponse.of(user, provider);
    }

    private void saveAuthentication(
        Authentication authentication,
        HttpServletRequest request,
        HttpServletResponse response
    ) {
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);
        contextRepository.saveContext(context, request, response);
    }

    public record RegisterRequest(
        @NotBlank @Size(max = 120) String name,
        @NotBlank @Email @Size(max = 320) String email,
        @NotBlank @Size(min = 10, max = 128) String password
    ) {
    }

    public record LoginRequest(
        @NotBlank @Email @Size(max = 320) String email,
        @NotBlank @Size(max = 128) String password
    ) {
    }

    public record UserResponse(String id, String name, String email, String provider) {
        static UserResponse password(AppUser user) {
            return of(user, "password");
        }

        static UserResponse of(AppUser user, String provider) {
            return new UserResponse(
                user.getId().toString(),
                user.getDisplayName(),
                user.getEmail(),
                provider
            );
        }
    }
}
