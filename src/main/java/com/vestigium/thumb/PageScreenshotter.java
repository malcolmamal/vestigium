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
                    if (isRedgifs(url)) {
                        dismissRedgifsConsent(page);
                        page.waitForTimeout(400);
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


