"""Example Django models for LMS project 'EduStream'.

This module focuses on `Course` and `Lesson` entities from the technical specification,
and includes a minimal `Category` model used for course filtering.
"""

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models
from django.utils.text import slugify


class Category(models.Model):
    """Course category for catalog filtering."""

    name = models.CharField(max_length=120, unique=True)
    slug = models.SlugField(max_length=140, unique=True, blank=True)

    class Meta:
        ordering = ("name",)
        verbose_name_plural = "categories"

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Course(models.Model):
    """Main product entity for paid learning content."""

    class Level(models.TextChoices):
        BEGINNER = "beginner", "Beginner"
        INTERMEDIATE = "intermediate", "Intermediate"
        ADVANCED = "advanced", "Advanced"

    instructor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="courses_authored",
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="courses",
    )
    title = models.CharField(max_length=180)
    slug = models.SlugField(max_length=200, unique=True, blank=True)
    description = models.TextField()
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        help_text="Use 0 for free courses.",
    )
    preview_image = models.ImageField(upload_to="courses/previews/", blank=True, null=True)
    level = models.CharField(max_length=20, choices=Level.choices, default=Level.BEGINNER)
    is_published = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=("slug",)),
            models.Index(fields=("is_published", "created_at")),
        ]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title


class Lesson(models.Model):
    """Single unit of learning content inside a course."""

    class VideoProvider(models.TextChoices):
        YOUTUBE = "youtube", "YouTube"
        VIMEO = "vimeo", "Vimeo"
        CUSTOM = "custom", "Custom"

    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name="lessons",
    )
    title = models.CharField(max_length=200)
    order = models.PositiveIntegerField(default=1)
    video_provider = models.CharField(
        max_length=20,
        choices=VideoProvider.choices,
        default=VideoProvider.YOUTUBE,
    )
    video_url = models.URLField(blank=True)
    content = models.TextField(blank=True)
    attachment = models.FileField(upload_to="courses/lessons/files/", blank=True, null=True)
    duration_seconds = models.PositiveIntegerField(default=0)
    is_preview = models.BooleanField(
        default=False,
        help_text="Preview lessons can be watched before buying.",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("course", "order", "id")
        constraints = [
            models.UniqueConstraint(
                fields=("course", "order"),
                name="unique_lesson_order_per_course",
            )
        ]

    def __str__(self):
        return f"{self.course.title}: {self.title}"
