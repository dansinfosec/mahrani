from wagtail.api.v2.router import WagtailAPIRouter
from wagtail.api.v2.views import PagesAPIViewSet
from wagtail.images.api.v2.views import ImagesAPIViewSet

api_v2_router = WagtailAPIRouter("wagtailapi")
api_v2_router.register_endpoint("pages", PagesAPIViewSet)
api_v2_router.register_endpoint("images", ImagesAPIViewSet)
