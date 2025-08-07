import { test, expect } from '@playwright/test';
import { PageHelpers } from '../../utils/page-helpers.js';

test.describe('Blog Functionality', () => {
  let pageHelpers;

  test.beforeEach(async ({ page }) => {
    pageHelpers = new PageHelpers(page);
  });

  test('should display blog listing page', async ({ page }) => {
    await page.goto('/blog');
    await expect(page).toHaveTitle(/Blog|Mooringmate/);
    
    await expect(page.locator('.blog-container, [data-testid="blog-listing"]')).toBeVisible();
    
    const blogPosts = page.locator('.blog-post, .post-card');
    await expect(blogPosts.first()).toBeVisible();
    
    await expect(blogPosts.first().locator('.post-title, .blog-title')).toBeVisible();
    await expect(blogPosts.first().locator('.post-excerpt, .blog-excerpt')).toBeVisible();
    await expect(blogPosts.first().locator('.post-date, .blog-date')).toBeVisible();
  });

  test('should display blog post featured image', async ({ page }) => {
    await page.goto('/blog');
    
    const firstPost = page.locator('.blog-post, .post-card').first();
    await expect(firstPost.locator('.post-image, .featured-image')).toBeVisible();
  });

  test('should navigate to blog detail page', async ({ page }) => {
    await page.goto('/blog');
    await pageHelpers.waitForLoadingToDisappear();
    
    const firstPost = page.locator('.blog-post, .post-card').first();
    await firstPost.locator('.post-title, .read-more-btn').first().click();
    
    await expect(page).toHaveURL(/\/blog-detail/);
  });

  test('should display blog detail page correctly', async ({ page }) => {
    await page.goto('/blog-detail?id=1');
    await pageHelpers.waitForLoadingToDisappear();
    
    await expect(page.locator('.blog-detail, [data-testid="blog-detail"]')).toBeVisible();
    
    await expect(page.locator('.article-title, .blog-title')).toBeVisible();
    await expect(page.locator('.article-content, .blog-content')).toBeVisible();
    await expect(page.locator('.article-author, .author-info')).toBeVisible();
    await expect(page.locator('.article-date, .publish-date')).toBeVisible();
  });

  test('should filter blog posts by category', async ({ page }) => {
    await page.goto('/blog');
    
    const categoryFilter = page.locator('.category-filter, [data-testid="category-filter"]');
    if (await categoryFilter.isVisible()) {
      await categoryFilter.selectOption('news');
      
      await pageHelpers.waitForLoadingToDisappear();
      
      const filteredPosts = page.locator('.blog-post, .post-card');
      await expect(filteredPosts.first()).toBeVisible();
    }
  });

  test('should search blog posts', async ({ page }) => {
    await page.goto('/blog');
    
    const searchInput = page.locator('.search-input, [data-testid="blog-search"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('berth');
      await page.click('.search-btn, [data-testid="search-btn"]');
      
      await pageHelpers.waitForLoadingToDisappear();
      
      const searchResults = page.locator('.blog-post, .post-card');
      if (await searchResults.count() > 0) {
        await expect(searchResults.first()).toBeVisible();
      }
    }
  });

  test('should display blog pagination', async ({ page }) => {
    await page.goto('/blog');
    await pageHelpers.waitForLoadingToDisappear();
    
    const pagination = page.locator('.pagination, [data-testid="pagination"]');
    if (await pagination.isVisible()) {
      const nextButton = pagination.locator('.next, [data-testid="next-page"]');
      if (await nextButton.isVisible()) {
        await nextButton.click();
        
        await pageHelpers.waitForLoadingToDisappear();
        await expect(page.locator('.blog-post, .post-card')).toHaveCount(1, { timeout: 10000 });
      }
    }
  });

  test('should display related posts', async ({ page }) => {
    await page.goto('/blog-detail?id=1');
    
    const relatedPosts = page.locator('.related-posts, [data-testid="related-posts"]');
    if (await relatedPosts.isVisible()) {
      const relatedPostItems = relatedPosts.locator('.related-post, .post-item');
      await expect(relatedPostItems.first()).toBeVisible();
    }
  });

  test('should display blog tags', async ({ page }) => {
    await page.goto('/blog-detail?id=1');
    
    const tagsSection = page.locator('.post-tags, [data-testid="blog-tags"]');
    if (await tagsSection.isVisible()) {
      const tagItems = tagsSection.locator('.tag, .tag-item');
      await expect(tagItems.first()).toBeVisible();
    }
  });

  test('should allow social media sharing', async ({ page }) => {
    await page.goto('/blog-detail?id=1');
    
    const shareSection = page.locator('.share-buttons, [data-testid="social-share"]');
    if (await shareSection.isVisible()) {
      await expect(shareSection.locator('.share-facebook')).toBeVisible();
      await expect(shareSection.locator('.share-twitter')).toBeVisible();
      await expect(shareSection.locator('.share-linkedin')).toBeVisible();
    }
  });

  test('should display blog comments section', async ({ page }) => {
    await page.goto('/blog-detail?id=1');
    
    const commentsSection = page.locator('.comments-section, [data-testid="comments"]');
    if (await commentsSection.isVisible()) {
      await expect(commentsSection.locator('.comments-title')).toBeVisible();
      
      const commentItems = commentsSection.locator('.comment, .comment-item');
      if (await commentItems.count() > 0) {
        await expect(commentItems.first().locator('.comment-author')).toBeVisible();
        await expect(commentItems.first().locator('.comment-text')).toBeVisible();
        await expect(commentItems.first().locator('.comment-date')).toBeVisible();
      }
    }
  });

  test('should submit new comment', async ({ page }) => {
    await page.goto('/blog-detail?id=1');
    
    const commentForm = page.locator('.comment-form, [data-testid="comment-form"]');
    if (await commentForm.isVisible()) {
      await commentForm.locator('input[name="name"]').fill('Test User');
      await commentForm.locator('input[name="email"]').fill('test@example.com');
      await commentForm.locator('textarea[name="comment"]').fill('This is a test comment.');
      
      await commentForm.locator('button[type="submit"]').click();
      
      await expect(page.locator('.success-message:has-text("comment"), .comment-success')).toBeVisible();
    }
  });

  test('should display blog archive', async ({ page }) => {
    await page.goto('/blog');
    
    const archiveSection = page.locator('.blog-archive, [data-testid="blog-archive"]');
    if (await archiveSection.isVisible()) {
      const archiveItems = archiveSection.locator('.archive-item, .archive-link');
      await expect(archiveItems.first()).toBeVisible();
      
      await archiveItems.first().click();
      await pageHelpers.waitForLoadingToDisappear();
    }
  });

  test('should show no results for invalid search', async ({ page }) => {
    await page.goto('/blog');
    
    const searchInput = page.locator('.search-input, [data-testid="blog-search"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('nonexistentterm12345');
      await page.click('.search-btn, [data-testid="search-btn"]');
      
      await pageHelpers.waitForLoadingToDisappear();
      
      await expect(page.locator('.no-results, [data-testid="no-results"]')).toBeVisible();
    }
  });

  test('should display blog sidebar', async ({ page }) => {
    await page.goto('/blog');
    
    const sidebar = page.locator('.blog-sidebar, [data-testid="blog-sidebar"]');
    if (await sidebar.isVisible()) {
      await expect(sidebar.locator('.recent-posts, .sidebar-recent')).toBeVisible();
      await expect(sidebar.locator('.categories, .sidebar-categories')).toBeVisible();
    }
  });

  test('should handle blog post not found', async ({ page }) => {
    await page.goto('/blog-detail?id=999999');
    
    await expect(page.locator('.not-found, [data-testid="post-not-found"]')).toBeVisible();
    await expect(page.locator('.error-message:has-text("not found")')).toBeVisible();
  });

  test('should display blog author bio', async ({ page }) => {
    await page.goto('/blog-detail?id=1');
    
    const authorBio = page.locator('.author-bio, [data-testid="author-bio"]');
    if (await authorBio.isVisible()) {
      await expect(authorBio.locator('.author-avatar')).toBeVisible();
      await expect(authorBio.locator('.author-name')).toBeVisible();
      await expect(authorBio.locator('.author-description')).toBeVisible();
    }
  });

  test('should navigate between blog posts', async ({ page }) => {
    await page.goto('/blog-detail?id=1');
    
    const navigation = page.locator('.post-navigation, [data-testid="post-nav"]');
    if (await navigation.isVisible()) {
      const nextPost = navigation.locator('.next-post, .nav-next');
      if (await nextPost.isVisible()) {
        await nextPost.click();
        await expect(page).toHaveURL(/blog-detail/);
      }
    }
  });
});