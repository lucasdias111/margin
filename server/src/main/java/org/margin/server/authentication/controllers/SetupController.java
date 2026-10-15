package org.margin.server.authentication.controllers;

import org.margin.server.authentication.models.SetupRequest;
import org.margin.server.authentication.services.FirstAdminSetup;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/setup")
public class SetupController {

    private final FirstAdminSetup firstAdminSetup;

    public SetupController(FirstAdminSetup firstAdminSetup) {
        this.firstAdminSetup = firstAdminSetup;
    }

    /** Lets the setup page check its link before showing the form. */
    @GetMapping("/{token}")
    public ResponseEntity<Void> check(@PathVariable String token) {
        return firstAdminSetup.isValidToken(token)
                ? ResponseEntity.noContent().build()
                : ResponseEntity.notFound().build();
    }

    @PostMapping
    public ResponseEntity<Void> setup(@RequestBody SetupRequest request) {
        try {
            firstAdminSetup.completeSetup(request.token(), request.displayName(), request.email(), request.password(),
                    request.encryptedPrivateKey(), request.publicKey(), request.salt(), request.iv());
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }
}
