"use strict";

const request = require("request");
const assert = require("assert");
const { resolve } = require("path");

const clientId = process.env.LINKEDIN_CLIENT_ID;
const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
const authorizationURL = process.env.LINKEDIN_AUTHORIZATION_URL;
let redirectURI = process.env.LINKEDIN_REDIRECT_URI;
const accessTokenURL = process.env.LINKEDIN_ACCESS_TOKEN_URL;

assert(clientId, "clientId is required");
assert(clientSecret, "clientSecret is required");
assert(authorizationURL, "authorizationURL is required");
assert(redirectURI, "redirectURI is required");
assert(accessTokenURL, "accessTokenURL is required");

redirectURI = redirectURI.replace("{__PORT__}", process.env.PORT || 3000);
class API {
  static getLinkedinId(access_token) {
    return new Promise((resolve, reject) => {
      const url = "https://api.linkedin.com/v2/userinfo";
      const headers = {
        Authorization: `Bearer ${access_token}`,
        "cache-control": "no-cache",
        "X-Restli-Protocol-Version": "2.0.0",
      };

      request.get({ url: url, headers: headers }, (err, response, body) => {
        if (err || response.statusCode !== 200) {
          return reject(err || JSON.parse(body));
        }
        resolve(JSON.parse(body));
      });
    });
  }

  static getAccessToken(authorization_code) {
    const body = {
      grant_type: "authorization_code",
      code: authorization_code,
      redirect_uri: redirectURI,
      client_id: clientId,
      client_secret: clientSecret,
    };
    const headers = {
      "Content-type": "application/x-www-form-urlencoded",
    };
    return new Promise((resolve, reject) => {
      request.post(
        { url: accessTokenURL, form: body, headers: headers },
        (err, response, body) => {
          if (err || response.statusCode !== 200) {
            return reject(err || JSON.parse(body));
          }
          resolve(JSON.parse(body));
        }
      );
    });
  }

  static getAuthorizationUrl() {
    const state = Buffer.from(
      Math.round(Math.random() * Date.now()).toString()
    ).toString("hex");
    const scope = encodeURIComponent("profile openid email w_member_social");
    return `${authorizationURL}?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectURI
    )}&state=${state}&scope=${scope}`;
  }

  static ugcPost(access_token, id) {
    const url = `https://api.linkedin.com/v2/ugcPosts`;
    const headers = {
      "Authorization": `Bearer ${access_token}`,
      "cache-control": "no-cache",
      "X-Restli-Protocol-Version": "2.0.0",
      "Content-type": "application/json"
    };

    const post = {
      author: `urn:li:person:${id}`,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: {
            text: "Hello World! Testing posting from JS on LinkedIn!",
          },
          shareMediaCategory: "NONE",
        },
      },
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
      },
    };
    return new Promise((resolve, reject) => {
      request.post(
        { url: url, headers: headers, body: JSON.stringify(post) },
        (err, response, body) => {
          if (err || response.statusCode !== 200) {
            return reject(err || JSON.parse(body));
          }
          return resolve(JSON.parse(body))
        }
      );
    });
  }
}

module.exports = API;
