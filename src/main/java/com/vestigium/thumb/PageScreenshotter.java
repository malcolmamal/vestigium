package com.vestigium.thumb;

import com.microsoft.playwright.Browser;
import com.microsoft.playwright.BrowserType;
import com.microsoft.playwright.Page;
import com.microsoft.playwright.Playwright;
import com.microsoft.playwright.options.WaitUntilState;
import java.time.Duration;
import org.springframework.stereotype.Component;

@Component
public class PageScreenshotter {

    public byte[] screenshotPng(String url) {
        try (Playwright playwright = Playwright.create()) {
            Browser browser = playwright.chromium().launch(new BrowserType.LaunchOptions()
                    .setHeadless(true));
            try {
                Page page = browser.newPage(new Browser.NewPageOptions().setViewportSize(1280, 720));
                page.navigate(url, new Page.NavigateOptions()
                        .setTimeout(Duration.ofSeconds(20).toMillis())
                        .setWaitUntil(WaitUntilState.NETWORKIDLE));
                return page.screenshot(new Page.ScreenshotOptions()
                        .setFullPage(false));
            } finally {
                browser.close();
            }
        }
    }
}


