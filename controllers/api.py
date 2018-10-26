# Here go your api methods.


@auth.requires_signature()
def add_post():
    """Adds a post."""
    db.post.insert(
        title=request.vars.title,
        content=request.vars.content,
    )
    return("ok") # We could also return something else, but this will be good enough.

