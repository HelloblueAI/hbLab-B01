
def test_import_create_app():
    from app_server import create_app
    assert callable(create_app)

