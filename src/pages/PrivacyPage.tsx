const PrivacyPage = () => (
  <div className="py-20">
    <div className="container max-w-3xl prose prose-sm">
      <h1 className="font-display text-4xl font-bold mb-8">Privacy Policy</h1>
      <p className="text-muted-foreground mb-6">Last updated: {new Date().toLocaleDateString()}</p>

      <h2>1. Information We Collect</h2>
      <p>We collect your email address and name when you create an account. We also collect the academic information you provide when creating transfer routes (colleges, majors, courses).</p>

      <h2>2. How We Use Information</h2>
      <p>Your information is used solely to provide the transfer planning dashboard service. We do not sell your personal information to third parties.</p>

      <h2>3. Data Storage</h2>
      <p>Your data is stored securely using industry-standard encryption and security practices.</p>

      <h2>4. Payments</h2>
      <p>Payment processing is handled by Stripe. We do not store your credit card information.</p>

      <h2>5. Data Retention</h2>
      <p>Your account data and dashboards are retained as long as your account is active. You may request deletion of your account and data at any time.</p>

      <h2>6. Contact</h2>
      <p>For privacy-related inquiries, contact us through our support page.</p>
    </div>
  </div>
);

export default PrivacyPage;
