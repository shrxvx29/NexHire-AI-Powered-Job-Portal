interface EmailTemplate {
  subject: string;
  html: string;
}

interface JobEmailData {
  title?: string;
  company?: string;
  location?: string;
}

// Escape user-provided values before inserting them into HTML.
const escapeHtml = (value: unknown = ""): string => {
  const entities: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };

  return String(value).replace(/[&<>"']/g, (character) => {
    return entities[character] ?? character;
  });
};

// Welcome Email
export const welcomeEmail = (name: string): EmailTemplate => {
  return {
    subject: "Welcome to NexHire – Your Career Journey Starts Here!",

    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Welcome to NexHire</title>
      </head>

      <body style="
        margin: 0;
        padding: 0;
        background-color: #f4f6f9;
        font-family: Arial, Helvetica, sans-serif;
        color: #333333;
      ">

        <table width="100%" cellpadding="0" cellspacing="0"
          role="presentation" style="padding: 30px 10px;">
          <tr>
            <td align="center">

              <table width="600" cellpadding="0" cellspacing="0"
                role="presentation" style="
                  max-width: 600px;
                  width: 100%;
                  background-color: #ffffff;
                  border-radius: 12px;
                  overflow: hidden;
                ">

                <!-- Header -->
                <tr>
                  <td style="
                    background-color: #282B4A;
                    padding: 30px;
                    text-align: center;
                  ">
                    <h1 style="
                      margin: 0;
                      color: #EEEBDA;
                      font-size: 30px;
                      letter-spacing: 1px;
                    ">
                      NexHire
                    </h1>

                    <p style="
                      margin: 10px 0 0;
                      color: #ffffff;
                      font-size: 14px;
                    ">
                      Discover Opportunities. Build Your Future.
                    </p>
                  </td>
                </tr>

                <!-- Main Content -->
                <tr>
                  <td style="padding: 35px 30px;">

                    <h2 style="
                      color: #282B4A;
                      font-size: 24px;
                      margin-top: 0;
                    ">
                      Welcome aboard, ${escapeHtml(name)}!
                    </h2>

                    <p style="
                      font-size: 15px;
                      line-height: 1.8;
                      color: #555555;
                    ">
                      Thank you for joining NexHire. We're excited
                      to help you discover opportunities that match
                      your skills, interests, and career goals.
                    </p>

                    <p style="
                      font-size: 15px;
                      line-height: 1.8;
                      color: #555555;
                    ">
                      Your account has been created successfully.
                      You can now explore job opportunities and
                      take the next step in your professional journey.
                    </p>

                    <!-- Features -->
                    <table width="100%" cellpadding="0" cellspacing="0"
                      role="presentation" style="
                        margin: 25px 0;
                        background-color: #f4f5fa;
                        border-radius: 8px;
                      ">
                      <tr>
                        <td style="padding: 20px;">

                          <p style="
                            margin: 0 0 15px;
                            color: #282B4A;
                            font-weight: bold;
                            font-size: 16px;
                          ">
                            What you can do next
                          </p>

                          <p style="
                            margin: 10px 0;
                            font-size: 14px;
                            line-height: 1.6;
                            color: #555555;
                          ">
                            &#10003; Explore job opportunities
                          </p>

                          <p style="
                            margin: 10px 0;
                            font-size: 14px;
                            line-height: 1.6;
                            color: #555555;
                          ">
                            &#10003; Complete your professional profile
                          </p>

                          <p style="
                            margin: 10px 0;
                            font-size: 14px;
                            line-height: 1.6;
                            color: #555555;
                          ">
                            &#10003; Discover opportunities that
                            fit your career goals
                          </p>

                        </td>
                      </tr>
                    </table>

                    <!-- CTA Button -->
                    <table cellpadding="0" cellspacing="0"
                      role="presentation" style="margin: 30px auto;">
                      <tr>
                        <td align="center" style="
                          background-color: #282B4A;
                          border-radius: 6px;
                        ">
                          <a
                            href="${escapeHtml(process.env.CLIENT_URL || "#")}"
                            style="
                              display: inline-block;
                              padding: 15px 30px;
                              color: #EEEBDA;
                              text-decoration: none;
                              font-size: 15px;
                              font-weight: bold;
                            "
                          >
                            Explore NexHire
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p style="
                      font-size: 14px;
                      line-height: 1.8;
                      color: #555555;
                    ">
                      We're glad you're here. Here's to new
                      opportunities and exciting career possibilities!
                    </p>

                    <p style="
                      font-size: 14px;
                      line-height: 1.8;
                      color: #555555;
                    ">
                      Best regards,<br />
                      <strong style="color: #282B4A;">
                        The NexHire Team
                      </strong>
                    </p>

                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="
                    background-color: #f4f5f9;
                    padding: 20px;
                    text-align: center;
                  ">
                    <p style="
                      margin: 0 0 8px;
                      color: #777777;
                      font-size: 12px;
                      line-height: 1.6;
                    ">
                      You received this email because an account
                      was created using your email address.
                    </p>

                    <p style="
                      margin: 0;
                      color: #999999;
                      font-size: 12px;
                    ">
                      &copy; ${new Date().getFullYear()} NexHire.
                      All rights reserved.
                    </p>
                  </td>
                </tr>

              </table>

            </td>
          </tr>
        </table>

      </body>
      </html>
    `,
  };
};

// New Job Posted Email
export const newJobPosted = (
  job: string | JobEmailData
): EmailTemplate => {
  const jobTitle = typeof job === "string" ? job : job.title;
  const company = typeof job === "string" ? "NexHire" : job.company;
  const location = typeof job === "string" ? "" : job.location;

  const jobUrl = process.env.CLIENT_URL
    ? `${process.env.CLIENT_URL}/jobs`
    : "#";

  return {
    subject: `New Job Posted: ${jobTitle} | NexHire`,

    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        </head>

        <body style="
          margin: 0;
          padding: 0;
          background-color: #f4f5f9;
          font-family: Arial, sans-serif;
        ">
          <div style="
            max-width: 600px;
            margin: 30px auto;
            background: #ffffff;
            border-radius: 12px;
            overflow: hidden;
          ">

            <div style="
              background: #282B4A;
              padding: 28px;
              text-align: center;
            ">
              <h1 style="color: #EEEBDA; margin: 0;">
                NexHire
              </h1>

              <p style="color: #ffffff; margin: 10px 0 0;">
                Discover your next opportunity
              </p>
            </div>

            <div style="padding: 30px;">
              <h2 style="color: #282B4A;">
                A New Job Opportunity Is Here!
              </h2>

              <p style="color: #555; line-height: 1.6;">
                Hello,
              </p>

              <p style="color: #555; line-height: 1.6;">
                A new job has been posted on NexHire that you may
                be interested in. Check out the details below.
              </p>

              <div style="
                background: #f4f5f9;
                padding: 20px;
                border-radius: 8px;
                margin: 24px 0;
              ">
                <h3 style="color: #282B4A; margin-top: 0;">
                  ${escapeHtml(jobTitle || "New Job Opportunity")}
                </h3>

                <p style="color: #555; margin: 8px 0;">
                  <strong>Company:</strong>
                  ${escapeHtml(company || "Not specified")}
                </p>

                ${
                  location
                    ? `<p style="color:#555; margin:8px 0;">
                         <strong>Location:</strong>
                         ${escapeHtml(location)}
                       </p>`
                    : ""
                }
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a
                  href="${escapeHtml(jobUrl)}"
                  style="
                    display: inline-block;
                    background: #282B4A;
                    color: #EEEBDA;
                    text-decoration: none;
                    padding: 14px 28px;
                    border-radius: 6px;
                    font-weight: bold;
                  "
                >
                  Explore Jobs
                </a>
              </div>

              <p style="color: #777; line-height: 1.6;">
                Keep your profile updated and apply for
                opportunities that match your skills.
              </p>

              <p style="color: #555;">
                Best regards,<br />
                <strong>NexHire Team</strong>
              </p>
            </div>

            <div style="
              background: #282B4A;
              padding: 16px;
              text-align: center;
            ">
              <p style="
                color: #EEEBDA;
                font-size: 12px;
                margin: 0;
              ">
                © ${new Date().getFullYear()} NexHire.
                All rights reserved.
              </p>
            </div>

          </div>
        </body>
      </html>
    `,
  };
};