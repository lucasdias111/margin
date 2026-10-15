package org.margin.server.social.margin.controllers;

import org.margin.server.shared.security.AuthenticatedUser;
import org.margin.server.social.api.MarginStorageUsage;
import org.margin.server.social.margin.entities.Margin;
import org.margin.server.social.margin.models.MarginRole;
import org.margin.server.social.margin.repositories.MarginRepository;
import org.margin.server.social.margin.service.MarginService;
import org.margin.server.users.api.AdminAccess;
import org.margin.server.users.api.UserLookup;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

/** Instance admins see every margin's metadata and can delete margins, but never read their content. */
@RestController
@RequestMapping("/api/admin/margins")
public class AdminMarginsController {

    private final AdminAccess adminAccess;
    private final MarginRepository marginRepository;
    private final MarginService marginService;
    private final MarginStorageUsage storageUsage;
    private final UserLookup userLookup;

    public AdminMarginsController(AdminAccess adminAccess,
                                  MarginRepository marginRepository,
                                  MarginService marginService,
                                  MarginStorageUsage storageUsage,
                                  UserLookup userLookup) {
        this.adminAccess = adminAccess;
        this.marginRepository = marginRepository;
        this.marginService = marginService;
        this.storageUsage = storageUsage;
        this.userLookup = userLookup;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public List<MarginOverview> list(@AuthenticationPrincipal AuthenticatedUser admin) {
        adminAccess.requireAdmin(admin.id());
        return marginRepository.findAllByDeletedAtIsNullOrderByCreatedAtDesc().stream()
                .map(this::overview)
                .toList();
    }

    @DeleteMapping("/{marginId}")
    public ResponseEntity<Void> delete(@PathVariable Long marginId,
                                       @AuthenticationPrincipal AuthenticatedUser admin) {
        adminAccess.requireAdmin(admin.id());
        marginService.deleteMargin(marginId);
        return ResponseEntity.noContent().build();
    }

    private MarginOverview overview(Margin margin) {
        Owner owner = margin.getMembers().stream()
                .filter(member -> member.getRole() == MarginRole.OWNER)
                .findFirst()
                .map(member -> {
                    UserLookup.UserContact contact = userLookup.contactOf(member.getUserId());
                    return new Owner(contact.id(), contact.displayName(), contact.email());
                })
                .orElse(null);
        return new MarginOverview(margin.getId(), margin.getName(), owner, margin.getMembers().size(),
                storageUsage.bytesUsedBy(margin.getId()), margin.getCreatedAt());
    }

    public record MarginOverview(Long id, String name, Owner owner, int memberCount, long storageBytes,
                                 Instant createdAt) {
    }

    public record Owner(Long id, String displayName, String email) {
    }
}
