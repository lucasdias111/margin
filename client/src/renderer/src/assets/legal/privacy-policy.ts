export const privacyPolicyHtml = `
<h1>Privacy Policy</h1>
<p><strong>Effective date: 10. April 2026</strong></p>

<p>margin ("we", "our", "us") is a communication and organization platform operated from Denmark. This Privacy Policy explains what personal data we collect, why we collect it, how we process it, and your rights under the General Data Protection Regulation (GDPR).</p>

<p>By creating an account or using margin, you agree to the practices described in this policy.</p>

<h2>1. Data Controller</h2>
<p>The data controller is:</p>
<p><strong>margin</strong><br/>Contact: hello@margin.chat</p>

<h2>2. What Data We Collect</h2>

<h3>2.1 Account Information</h3>
<p>When you create an account, we collect your email address, display name, and a hashed version of your password. We never store your password in plain text.</p>

<h3>2.2 Messages and Content</h3>
<p>margin handles messages differently depending on the context:</p>
<ul>
  <li><strong>Private messages</strong> (direct messages) are end-to-end encrypted. We cannot read their content. Encrypted message data is stored on our servers solely for delivery and synchronization.</li>
  <li><strong>Channel and group messages</strong> are not end-to-end encrypted. They are transmitted over encrypted connections (TLS) and stored encrypted at rest on our servers, but are readable by the server for delivery purposes.</li>
</ul>

<h3>2.3 Usage and Connection Data</h3>
<p>We collect basic technical data necessary for the service to function: IP addresses during active connections, login timestamps, and online/offline status. This data is used for session management, presence features, and security purposes.</p>

<h3>2.4 Call Data</h3>
<p>Voice and video calls use peer-to-peer (WebRTC) connections where possible, meaning audio and video streams flow directly between participants. For group calls, media is routed through our SFU (Selective Forwarding Unit) server for distribution but is not recorded or stored. We store basic call metadata (participants, timestamps, duration) for call history.</p>

<h2>3. Why We Process Your Data (Legal Basis)</h2>
<p>We process your personal data on the following legal bases under the GDPR:</p>
<ul>
  <li><strong>Contract performance</strong> (Art. 6(1)(b)): Processing necessary to provide the margin service to you — account management, message delivery, call functionality.</li>
  <li><strong>Legitimate interest</strong> (Art. 6(1)(f)): Security measures, abuse prevention, and service improvements. Our legitimate interest does not override your fundamental rights.</li>
  <li><strong>Legal obligation</strong> (Art. 6(1)(c)): Where we are required to retain data by applicable law.</li>
  <li><strong>Consent</strong> (Art. 6(1)(a)): Where applicable, such as optional communications. You may withdraw consent at any time.</li>
</ul>

<h2>4. Data Storage and Security</h2>
<p>All data is stored on servers located in the European Union, hosted by Hetzner Online GmbH in Germany. Data is encrypted in transit (TLS) and at rest. Private messages are additionally protected by end-to-end encryption, meaning only the communicating parties can read them.</p>
<p>We implement appropriate technical and organizational measures to protect your data against unauthorized access, alteration, disclosure, or destruction.</p>

<h2>5. Sub-processors</h2>
<p>We use the following third-party service providers who may process personal data on our behalf:</p>
<table>
  <thead>
    <tr><th>Provider</th><th>Purpose</th><th>Data Processed</th><th>Location</th></tr>
  </thead>
  <tbody>
    <tr><td>Hetzner Online GmbH</td><td>Server hosting and object storage</td><td>All service data</td><td>Germany (EU)</td></tr>
    <tr><td>Scaleway (Iliad Group)</td><td>Transactional email delivery</td><td>Email addresses</td><td>France (EU)</td></tr>
    <tr><td>Mollie B.V.</td><td>Payment processing and subscription management</td><td>Name, email address, billing and transaction data</td><td>Netherlands (EU)</td></tr>
  </tbody>
</table>
<p>All sub-processors are located within the EU. No personal data is transferred outside the European Economic Area. Mollie acts as an independent data controller for payment data they collect directly; their privacy policy is available at mollie.com/privacy.</p>

<h2>6. Data Retention</h2>
<p>We retain your data for as long as your account is active. Messages and content remain stored until you or your organization's administrator deletes them, or until you delete your account. Upon account deletion, your personal data will be removed within 30 days, except where retention is required by law.</p>

<h2>7. Your Rights</h2>
<p>Under the GDPR, you have the following rights:</p>
<ul>
  <li><strong>Access:</strong> Request a copy of the personal data we hold about you.</li>
  <li><strong>Rectification:</strong> Request correction of inaccurate data.</li>
  <li><strong>Erasure:</strong> Request deletion of your data ("right to be forgotten").</li>
  <li><strong>Restriction:</strong> Request that we limit how we process your data.</li>
  <li><strong>Portability:</strong> Request your data in a structured, machine-readable format.</li>
  <li><strong>Objection:</strong> Object to processing based on legitimate interest.</li>
</ul>
<p>To exercise any of these rights, contact us at hello@margin.chat. We will respond within 30 days. You also have the right to lodge a complaint with the Danish Data Protection Agency (Datatilsynet) at datatilsynet.dk.</p>

<h2>8. Cookies and Local Storage</h2>
<p>margin uses session storage to maintain your authentication state. We do not use tracking cookies, advertising cookies, or any third-party analytics tools. No data is shared with advertisers.</p>

<h2>9. Age Requirement</h2>
<p>You must be at least 16 years old to use margin. We do not knowingly collect personal data from anyone under 16. If we become aware that a user is under 16, we will delete their account and data promptly.</p>

<h2>10. Changes to This Policy</h2>
<p>We may update this Privacy Policy from time to time. If we make material changes, we will notify you through the margin application or by email. The effective date at the top of this document indicates when it was last updated.</p>

<h2>11. Contact</h2>
<p>If you have questions about this Privacy Policy or your personal data, contact us at:</p>
<p><strong>hello@margin.chat</strong>
`
