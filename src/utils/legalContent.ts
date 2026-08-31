export interface LegalSection {
  id: string;
  title: string;
  icon: string;
  body: string;
}

export const LEGAL_SECTIONS: LegalSection[] = [
  {
    id: 'health_disclaimer',
    title: 'General Health & Medical Disclaimer',
    icon: 'HeartPulse',
    body: `O1FC is a fitness technology platform. All exercise routines, workout dispatch logs, telemetry data, Intel nutrition guidance, and supplement suggestions provided through the app are intended for informational and athletic-conditioning purposes only. They do not constitute medical advice, diagnosis, or treatment.

Physical exercise — especially heavy resistance training, high-intensity interval training, and endurance conditioning — carries inherent risk of serious injury or death. You must consult a registered medical practitioner or qualified health professional before starting any new training regimen, supplement protocol, or dietary program, particularly if you have pre-existing health conditions, cardiovascular risk factors, musculoskeletal injuries, or are pregnant.

O1FC, its developers, coaches using the platform, and affiliated parties accept no responsibility for any injury, illness, loss, or damage — direct or indirect — arising from your use of the app or reliance on any training, nutrition, or supplement information provided. You assume full responsibility for all decisions and actions taken in connection with your use of the app.

If you experience chest pain, dizziness, fainting, shortness of breath, or any other concerning symptom during physical activity, stop immediately and seek medical attention.`,
  },
  {
    id: 'coach_liability_waiver',
    title: 'Coach Marketplace Liability Waiver',
    icon: 'Dumbbell',
    body: `O1FC operates solely as a technology intermediary that connects athletes with independent third-party coaches, trainers, and training partners. O1FC is not a coaching provider, does not employ or directly supervise any coach listed on the platform, and does not verify, endorse, or guarantee the credentials, qualifications, insurance status, or conduct of any third-party coach.

Any coaching advice, programming, instruction, dietary or supplement guidance provided by a third-party coach is the sole responsibility of that coach. O1FC assumes zero liability for any act, omission, advice, or instruction given by a third-party coach, and zero liability for any injury, loss, or damage — howsoever caused — arising from your engagement with a coach arranged through the platform.

You agree to independently verify the qualifications, insurance, and suitability of any coach before engaging their services, and to raise any complaint directly with the coach in the first instance. Any dispute with a coach is a matter between you and that coach; O1FC's role is limited to providing the connection platform.

Consumer Rights: Nothing in this waiver excludes, restricts, or modifies any non-excludable rights or guarantees you may have under applicable consumer protection laws in your jurisdiction. Where liability cannot be excluded, O1FC's liability is limited to the maximum extent permitted by law, and in any event to the amount you have paid O1FC in the twelve (12) months preceding the claim.`,
  },
  {
    id: 'global_law_store_compliance',
    title: 'Global Law & Store Policy Compliance',
    icon: 'Shield',
    body: `O1FC is operated in accordance with applicable laws in your jurisdiction, including relevant consumer protection, privacy, and data protection regulations.

Privacy & Data Handling: Personal and health information collected through the app is handled in accordance with applicable privacy and data protection laws in your jurisdiction, including where relevant the EU General Data Protection Regulation (GDPR), the UK Data Protection Act 2018, the California Consumer Privacy Act (CCPA), and comparable laws worldwide. We collect only the information necessary to provide fitness tracking, coaching connections, and related services. We do not sell your personal or health data to third-party advertisers. You may request access to, correction of, or deletion of your personal information at any time via Settings → Delete Account & Purge Data.

Apple App Store (Guideline 5.1.1): This app provides in-app account creation and a fully functional in-app account deletion pathway. All data associated with your account is purged upon deletion. Any health or biometric data is collected with your explicit consent and used only for the stated app functionality.

Google Play Data Safety: Data collection and usage disclosures are provided in the Google Play Data Safety section for this app. Biometric data, health telemetry, and fitness logs are treated as sensitive data and are not shared with third parties for advertising purposes.

Terms of Service: By creating an account, you agree to these terms, the Privacy Policy, and all applicable store policies. You may withdraw consent and delete your account at any time.`,
  },
  {
    id: 'biometric_privacy',
    title: 'Biometric Privacy Rights',
    icon: 'Lock',
    body: `O1FC may collect and process biometric and health telemetry data — including heart rate, HRV, sleep metrics, step counts, body weight, body composition, workout performance, and related wearable sensor data — for the sole purpose of providing fitness tracking, progress analysis, coaching insights, and related app features.

Your Rights:
• Explicit Consent: Biometric data is collected only with your explicit, informed consent. You may withdraw consent at any time by disabling telemetry sync in Settings or by deleting your account.
• No Sale of Data: We will never sell your biometric or health data to third-party advertisers, data brokers, or insurance providers.
• Purpose Limitation: Biometric data is used exclusively to deliver and improve the app's fitness features. It is not used for any purpose unrelated to the app's core functionality.
• Data Minimisation: We collect only the biometric data necessary to provide the features you actively use.
• Retention & Deletion: Your biometric data is retained only for as long as your account is active. Upon account deletion, all biometric data is permanently purged from our systems.
• Apple & Google Compliance: Biometric data handling complies with Apple's App Store guidelines for health and fitness data, and Google Play's data safety requirements for sensitive personal data.
• Global Privacy Standards: Biometric data is treated as "sensitive information" under applicable privacy and data protection laws in your jurisdiction, including where relevant the GDPR, UK Data Protection Act, CCPA/CPRA, and comparable laws worldwide, and is handled with the heightened protections required for sensitive personal data.

You may export your data at any time via Settings, and you may request a complete purge of your biometric data by using the Delete Account & Purge Data function in Settings.`,
  },
];

export const CONSENT_CHECKS = [
  {
    id: 'health_consent' as const,
    label:
      'I acknowledge that exercise routines, telemetry, and Intel nutrition guidance are for informational/fitness optimization purposes only. I will consult a registered physician before starting heavy conditioning.',
  },
  {
    id: 'coach_liability_consent' as const,
    label:
      'I agree that the platform acts solely as a technology intermediary connecting me with independent third-party coaches, and the platform assumes zero liability for third-party coaching advice or injuries.',
  },
  {
    id: 'terms_consent' as const,
    label:
      'I accept the Terms of Service, Privacy Policy, applicable Consumer Protection Laws, and Store Privacy Guidelines.',
  },
];
