# Here go your api methods.


@auth.requires_signature()
def add_post():
    post_id = db.post.insert(
        post_title=request.vars.post_title,
        post_content=request.vars.post_content,
    )
    # We return the id of the new post, so we can insert it along all the others.
    return response.json(dict(post_id=post_id))


def get_post_list():
    post_list = db(db.post).select(db.post.id, db.post.post_title, db.post.post_content,
                                   orderby=~db.post.post_time).as_list()
    # I like to always return a dictionary.
    return response.json(dict(post_list=post_list))

