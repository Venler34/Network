from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone

class User(AbstractUser):
    following = models.ManyToManyField('self', symmetrical=False, related_name="followers")

class Post(models.Model):
    content = models.CharField(max_length=500)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="posts", null=True)
    created = models.DateTimeField(null=True)
    likes = models.ManyToManyField(User, related_name="userLikes")

    def save(self, *args, **kwargs):
        if not self.id:
            self.created = timezone.now()
        
        return super(Post, self).save(*args, **kwargs)