const TermsPage = () => (
  <div className="py-20">
    <div className="container max-w-3xl prose prose-sm">
      <h1 className="font-display text-4xl font-bold mb-8">Terms of Service</h1>
      <p className="text-muted-foreground mb-6">Last updated: {new Date().toLocaleDateString()}</p>
      
      <h2>1. Acceptance of Terms</h2>
      <p>By accessing and using College Rules, you agree to be bound by these Terms of Service.</p>

      <h2>2. Service Description</h2>
      <p>College Rules provides personalized transfer planning dashboards for community college students. Our service is a planning and organization tool, not a replacement for official academic advising.</p>

      <h2>3. Accuracy Disclaimer</h2>
      <p>While we build our data from official sources, requirements may change at any time. You must verify all requirements with your academic counselor and official institutional sources. We are not responsible for decisions made based on our data.</p>

      <h2>4. Purchases</h2>
      <p>Route credits are purchased through one-time payments. Credits do not expire. Refunds are available within 7 days of purchase for unused credits.</p>

      <h2>5. Account Responsibility</h2>
      <p>You are responsible for maintaining the security of your account and any activities that occur under it.</p>

      <h2>6. Limitation of Liability</h2>
      <p>College Rules is provided "as is." We are not liable for any damages arising from your use of the service or decisions made based on information provided.</p>

      <h2>7. Changes</h2>
      <p>We may update these terms at any time. Continued use of the service constitutes acceptance of updated terms.</p>
    </div>
  </div>
);

export default TermsPage;
