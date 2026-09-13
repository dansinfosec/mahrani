from django.urls import path

from .views import HomePageView, PageBySlugView, SiteSettingsView

urlpatterns = [
    path("site/", SiteSettingsView.as_view(), name="site-settings"),
    path("pages/home/", HomePageView.as_view(), name="home-page"),
    path("pages/<slug:slug>/", PageBySlugView.as_view(), name="page-by-slug"),
]
