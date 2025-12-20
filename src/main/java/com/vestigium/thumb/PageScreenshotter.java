package com.vestigium.thumb;

import com.microsoft.playwright.Browser;
import com.microsoft.playwright.BrowserContext;
import com.microsoft.playwright.BrowserType;
import com.microsoft.playwright.Page;
import com.microsoft.playwright.Playwright;
import java.time.Duration;
import java.util.List;
import java.util.Map;
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
}


