package com.vestigium.thumb;

import com.microsoft.playwright.Browser;
import com.microsoft.playwright.BrowserContext;
import com.microsoft.playwright.BrowserType;
import com.microsoft.playwright.Locator;
import com.microsoft.playwright.Page;
import com.microsoft.playwright.Playwright;
import java.net.URI;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.stereotype.Component;

@Component
public class PageScreenshotter {

    private static final String UA =
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

    public byte[] screenshotPng(String url) {
        try (Playwright playwright = Playwright.create()) {
            Browser browser = playwright.chromium().launch(new BrowserType.LaunchOptions()
                    .setHeadless(true)
                    .setArgs(List.of("--disable-blink-features=AutomationControlled")));
            try {
                BrowserContext ctx = browser.newContext(new Browser.NewContextOptions()
                        .setViewportSize(1280, 720)
                        .setUserAgent(UA)
                        .setLocale("en-US")
                        .setTimezoneId("Europe/Warsaw")
                        .setExtraHTTPHeaders(Map.of("Accept-Language", "en-US,en;q=0.9")));
                try {
                    Page page = ctx.newPage();
                    // Reduce obvious automation signals.
                    page.addInitScript("Object.defineProperty(navigator, 'webdriver', { get: () => undefined });");
                    page.navigate(url, new Page.NavigateOptions()
                            .setTimeout(Duration.ofSeconds(25).toMillis())
                            .setWaitUntil(com.microsoft.playwright.options.WaitUntilState.DOMCONTENTLOADED));
                    // Small delay to let above-the-fold render.
                    page.waitForTimeout(800);

                    // Site-specific dismissals to avoid consent popups covering screenshots.
                    if (isInstagram(url)) {
                        // Instagram often shows login prompts or requires longer load times.
                        // Wait longer and try to dismiss login prompts.
                        page.waitForTimeout(2000);
                        dismissInstagramLoginPrompt(page);
                        page.waitForTimeout(1000);
                        // Try to wait for actual content to appear
                        try {
                            page.waitForSelector("article, img[src*='instagram'], [role='main']", 
                                new Page.WaitForSelectorOptions().setTimeout(3000));
                        } catch (Exception ignored) {
                            // Content might not load, continue anyway
                        }
                    } else if (isRedgifs(url)) {
                        dismissRedgifsConsent(page);
                        page.waitForTimeout(400);
                    } else if (isReddit(url)) {
                        // Reddit popups can be slow to appear.
                        page.waitForTimeout(1000);
                        dismissRedditCookiePopup(page);
                        page.waitForTimeout(500);
                        // After clicking popups, Reddit sometimes shifts focus or scroll.
                        // Ensure we are back at the very top for a clean screenshot.
                        page.evaluate("window.scrollTo(0, 0)");
                        page.waitForTimeout(200);
                    }

                    return page.screenshot(new Page.ScreenshotOptions()
                            .setFullPage(false));
                } finally {
                    ctx.close();
                }
            } finally {
                browser.close();
            }
        }
    }

    private static boolean isRedgifs(String url) {
        return host(url).map(h -> h.endsWith("redgifs.com")).orElse(false);
    }

    private static boolean isInstagram(String url) {
        return host(url).map(h -> h.contains("instagram.com")).orElse(false);
    }

    private static boolean isReddit(String url) {
        return host(url).map(h -> h.contains("reddit.com")).orElse(false);
    }

    private static Optional<String> host(String url) {
        try {
            var uri = URI.create(url);
            var host = uri.getHost();
            if (host == null || host.isBlank()) {
                return Optional.empty();
            }
            return Optional.of(host.toLowerCase());
        } catch (Exception ignored) {
            return Optional.empty();
        }
    }

    private static void dismissRedgifsConsent(Page page) {
        // Best-effort; Redgifs often shows cookie + age/consent dialogs.
        tryClick(page, "button:has-text(\"Accept all\")", 2000);
        tryClick(page, "button:has-text(\"I agree\")", 2000);
        // Some variants use different wording.
        tryClick(page, "button:has-text(\"Accept\")", 1500);
        tryClick(page, "button:has-text(\"Agree\")", 1500);
    }

    private static void dismissInstagramLoginPrompt(Page page) {
        // Instagram often shows cookie consent dialogs first.
        // Accept cookies to allow content to load.
        tryClick(page, "button:has-text('Allow all cookies')", 2000);
        tryClick(page, "button:has-text('Allow All Cookies')", 2000);
        tryClick(page, "button:has-text('Accept all')", 2000);
        tryClick(page, "button:has-text('Accept All')", 2000);
        tryClick(page, "button:has-text('Accept')", 1500);
        
        // Instagram often shows login prompts or "Not Now" buttons.
        // Try to dismiss these to see public content.
        tryClick(page, "button:has-text('Not Now')", 2000);
        tryClick(page, "button:has-text('Not now')", 2000);
        tryClick(page, "a[href*='/accounts/login/?next=']", 1000);
        // Sometimes there's a close button on modals
        tryClick(page, "button[aria-label='Close']", 1000);
        tryClick(page, "svg[aria-label='Close']", 1000);
        // Try to find and click away from login modals
        tryClick(page, "[role='dialog'] button:has-text('Not Now')", 1500);
    }

    private static void dismissRedditCookiePopup(Page page) {
        // Reddit's cookie banner often reloads the page if you click "Accept All".
        // The user wants to click the 'X' button in the corner of the popup.
        // We try multiple common selectors for the 'X' button or the reject button.
        tryClick(page, "button[aria-label='Close']", 2000);
        tryClick(page, "button:has-text('Reject Optional Cookies')", 1000);
        // Sometimes it's a plain 'X' in a button or a div acting as a button
        tryClick(page, "button:has-text('X')", 1000);
        tryClick(page, "div[role='button']:has-text('X')", 1000);
        // Overlays often have 'close' in their class or ID
        tryClick(page, "[class*='close']", 1000);
        // Shreddit (new Reddit) specific selectors
        tryClick(page, "shreddit-experience-tree button[aria-label='Close']", 1000);
        tryClick(page, "shreddit-experience-tree button:has-text('Reject')", 1000);
    }

    private static void tryClick(Page page, String selector, int timeoutMs) {
        try {
            Locator loc = page.locator(selector).first();
            if (loc.count() == 0) {
                return;
            }
            loc.click(new Locator.ClickOptions().setTimeout(timeoutMs));
        } catch (Exception ignored) {
            // ignore
        }
    }
}


