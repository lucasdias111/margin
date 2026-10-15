package org.margin.server.email;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.util.Locale;

@Service
@Slf4j
public class EmailService {
    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;
    private final boolean enabled;

    @Value("${margin.app.base-url:http://localhost:8080}")
    private String baseUrl;

    @Value("${margin.mail.from:noreply@localhost}")
    private String fromAddress;

    @Value("${margin.mail.logo-url:}")
    private String logoUrl;

    @Value("${margin.mail.log-only:false}")
    private boolean logOnly;

    private static final String GUEST_EMAIL_DOMAIN = "@guests.margin.invalid";

    public EmailService(ObjectProvider<JavaMailSender> mailSender,
                        TemplateEngine templateEngine,
                        @Value("${spring.mail.host:}") String mailHost) {
        this.mailSender = mailSender.getIfAvailable();
        this.templateEngine = templateEngine;
        this.enabled = !mailHost.isBlank() && this.mailSender != null;
    }

    /** Whether this instance has SMTP configured. Without it every send is skipped. */
    public boolean isEnabled() {
        return enabled;
    }

    public void sendEmail(String to, String subject, String htmlBody) throws MessagingException {
        if (to != null && to.toLowerCase().endsWith(GUEST_EMAIL_DOMAIN)) {
            log.error("Refused to send mail to a guest address: {}", to);
            return;
        }
        if (logOnly) {
            log.info("[EMAIL LOG-ONLY] to={} subject=\"{}\" body={}", to, subject, htmlBody);
            return;
        }
        if (!enabled) {
            log.info("Mail is not configured; not sending \"{}\"", subject);
            return;
        }
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, "utf-8");
        helper.setFrom(fromAddress);
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(htmlBody, true);
        mailSender.send(message);
    }

    public void sendEmailWithCalendar(String to, String subject, String htmlBody,
                                      String icsFileName, String icsContent) throws MessagingException {
        if (to != null && to.toLowerCase().endsWith(GUEST_EMAIL_DOMAIN)) {
            log.error("Refused to send mail to a guest address: {}", to);
            return;
        }
        if (logOnly) {
            log.info("[EMAIL LOG-ONLY] to={} subject=\"{}\" ics={}", to, subject, icsFileName);
            return;
        }
        if (!enabled) {
            log.info("Mail is not configured; not sending \"{}\"", subject);
            return;
        }
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "utf-8");
        helper.setFrom(fromAddress);
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(htmlBody, true);
        helper.addAttachment(icsFileName,
                new org.springframework.core.io.ByteArrayResource(
                        icsContent.getBytes(java.nio.charset.StandardCharsets.UTF_8)),
                "text/calendar");
        mailSender.send(message);
    }

    public String buildMeetingInviteMail(String inviterName, String meetingTitle, String marginName,
                                         String whenLine, String joinUrl, boolean cancelled) {
        Context ctx = new Context(Locale.ENGLISH);
        ctx.setVariable("logoUrl", logoUrl.isBlank() ? null : logoUrl);
        ctx.setVariable("inviterName", inviterName);
        ctx.setVariable("meetingTitle", meetingTitle);
        ctx.setVariable("marginName", marginName);
        ctx.setVariable("whenLine", whenLine);
        ctx.setVariable("joinUrl", joinUrl);
        ctx.setVariable("cancelled", cancelled);
        return templateEngine.process("email/meeting-invite", ctx);
    }


    public String buildPasswordResetMail(String displayName, String resetToken) {
        Context ctx = new Context(Locale.ENGLISH);
        ctx.setVariable("logoUrl", logoUrl.isBlank() ? null : logoUrl);
        ctx.setVariable("displayName", displayName);
        ctx.setVariable("resetUrl", baseUrl + "/reset-password/" + resetToken);

        return templateEngine.process("email/password-reset", ctx);
    }

    public String buildRegistrationMail(String displayName, String activationToken) {
        Context ctx = new Context(Locale.ENGLISH);
        ctx.setVariable("logoUrl", logoUrl.isBlank() ? null : logoUrl);
        ctx.setVariable("displayName", displayName);
        ctx.setVariable("activationUrl", baseUrl + "/email-activation/" + activationToken);

        return templateEngine.process("email/registration", ctx);
    }
}
