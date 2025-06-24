import React from "react";

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-4">About Is It Pet Friendly?</h1>
      <p className="text-lg mb-2">
        Is It Pet Friendly? is a community-driven platform where users can vote and share information 
        about whether places are pet-friendly. My goal is to help pet owners find welcoming locations 
        for their best friends.
      </p>
      <p className="text-md text-gray-600 mb-8">
        Built by Austin Wang. Contributions and feedback are welcome!
        <br/>
        <br/>
        <a href="https://github.com/wangaustin/is-it-pet-friendly" className="text-blue-500 hover:text-blue-700">GitHub</a>
        <br/>
        <a href="https://austinwang.co" className="text-blue-500 hover:text-blue-700">Personal Website</a>
      </p>

      {/* Terms of Service */}
      <div className="mt-12 mb-8">
        <h2 className="text-2xl font-bold mb-4 text-gray-900">Terms of Service</h2>
        <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-6 space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2 text-gray-800">1. Acceptance of Terms</h3>
            <p className="text-gray-700 leading-relaxed">
              By accessing and using Is It Pet Friendly?, you accept and agree to be bound by the terms and provision of this agreement.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2 text-gray-800">2. Use License</h3>
            <p className="text-gray-700 leading-relaxed">
              Permission is granted to temporarily access Is It Pet Friendly? for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2 text-gray-800">3. User Contributions</h3>
            <p className="text-gray-700 leading-relaxed">
              Users may contribute votes and information about pet-friendly locations. You agree to provide accurate, truthful information and not to submit false or misleading data.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2 text-gray-800">4. Community Guidelines</h3>
            <p className="text-gray-700 leading-relaxed">
              Be respectful and constructive in your contributions. Do not submit spam, offensive content, or information that violates any applicable laws or regulations.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2 text-gray-800">5. Disclaimer</h3>
            <p className="text-gray-700 leading-relaxed">
              The information on this platform is provided by the community and may not always be accurate or up-to-date. Always verify pet policies directly with the establishment before visiting.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2 text-gray-800">6. Limitation of Liability</h3>
            <p className="text-gray-700 leading-relaxed">
              Is It Pet Friendly? is not responsible for any decisions made based on the information provided on this platform. Use at your own discretion.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2 text-gray-800">7. Changes to Terms</h3>
            <p className="text-gray-700 leading-relaxed">
              We reserve the right to modify these terms at any time. Continued use of the platform constitutes acceptance of any changes.
            </p>
          </div>
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-4 text-gray-900">Privacy Notice</h2>
        <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-6 space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2 text-gray-800">Information We Collect</h3>
            <p className="text-gray-700 leading-relaxed">
              We collect information you provide when you sign in (email address, name, profile picture from Google OAuth) and the votes you submit on pet-friendly locations.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2 text-gray-800">How We Use Your Information</h3>
            <p className="text-gray-700 leading-relaxed">
              Your information is used to: authenticate your account, display your voting history, and provide community voting data. We do not sell or share your personal information with third parties.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2 text-gray-800">Data Storage</h3>
            <p className="text-gray-700 leading-relaxed">
              Your account information and votes are stored securely. You can request deletion of your account and associated data at any time by contacting us.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2 text-gray-800">Cookies and Analytics</h3>
            <p className="text-gray-700 leading-relaxed">
              We use essential cookies for authentication and may use analytics to improve the platform. You can control cookie settings through your browser.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2 text-gray-800">Third-Party Services</h3>
            <p className="text-gray-700 leading-relaxed">
              We use Google OAuth for authentication and Google Maps for location data. These services have their own privacy policies which you should review.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2 text-gray-800">Your Rights</h3>
            <p className="text-gray-700 leading-relaxed">
              You have the right to access, correct, or delete your personal information. You can also opt out of certain data collection practices.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2 text-gray-800">Contact Information</h3>
            <p className="text-gray-700 leading-relaxed">
              For privacy-related questions or to exercise your rights, please contact us through the GitHub repository or personal website links above.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2 text-gray-800">Updates to Privacy Notice</h3>
            <p className="text-gray-700 leading-relaxed">
              This privacy notice may be updated periodically. We will notify users of significant changes through the platform or email.
            </p>
          </div>
        </div>
      </div>

      {/* Last Updated */}
      <div className="mt-8 text-center text-sm text-gray-500">
        Last updated: {new Date().toLocaleDateString()}
      </div>
    </div>
  );
} 