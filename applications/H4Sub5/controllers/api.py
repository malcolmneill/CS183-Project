# Here go your api methods.


@auth.requires_signature()
def submit_post():
    post_id = db.post.insert(
        # post_author=get_user_email(),
        post_title=request.vars.post_title,
        post_content=request.vars.post_content,
    )
    # We return the id of the new post, so we can insert it along all the others.
    return response.json(dict(post_id=post_id))

@auth.requires_signature()
def submit_reply():
    reply_id = db.reply.insert(
        # post_author=get_user_email(),
        post_id=int(request.vars.post_id),
        reply_content=request.vars.reply_content,
    )
    # We return the id of the new post, so we can insert it along all the others.
    return response.json(dict(reply_id=reply_id))


def get_post_list():
    results = []
    if auth.user is None:
        # Not logged in.
        rows = db().select(db.post.ALL, orderby=~db.post.post_time)
        for row in rows:
            results.append(dict(
                id=row.id,
                post_title=row.post_title,
                post_content=row.post_content,
                post_author=row.post_author,
                like = False, # Anyway not used as the user is not logged in.
                dislike = False,
            ))
    else:
        # Logged in.
        rows = db().select(db.post.ALL, db.user_like.ALL, db.user_dislike.ALL,
                            left=[
                                db.user_like.on((db.user_like.post_id == db.post.id) & (db.user_like.user_email == auth.user.email)),
                                db.user_dislike.on((db.user_dislike.post_id == db.post.id) & (db.user_dislike.user_email == auth.user.email)),
                            ],
                            orderby=~db.post.post_time)
        for row in rows:
            results.append(dict(
                id=row.post.id,
                post_title=row.post.post_title,
                post_content=row.post.post_content,
                post_author=row.post.post_author,
                like = False if row.user_like.id is None else True,
                dislike = False if row.user_dislike.id is None else True,
                vote_count = vote_count(row.post.id),
            ))
    # For homogeneity, we always return a dictionary.
    return response.json(dict(post_list=results))

def get_reply_list():
    post_id=int(request.vars.post_id)
    results = []
    rows = db().select(db.reply.ALL, orderby=~db.reply.reply_time)
    for row in rows:
        if row.post_id == post_id:
            results.append(dict(
                id=row.id,
                post_id=row.post_id,
                reply_content=row.reply_content,
                reply_author=row.reply_author,
            ))

    # For homogeneity, we always return a dictionary.
    return response.json(dict(reply_list=results))

@auth.requires_signature()
def set_edit_content():
    post_id = int(request.vars.post_id)
    updated_post_content = request.vars.post_content
    # row = db(db.post.post_id == post_id).select()
    # row.first().update_record(post_content = updated_post_content)
    db.post.update_or_insert(
        (db.post.id == post_id) & (db.post.post_author == auth.user.email),
        post_content = updated_post_content
    )
    return response.json(dict(post_content=updated_post_content))

@auth.requires_signature()
def set_edit_reply_content():
    reply_id = int(request.vars.reply_id)
    updated_reply_content = request.vars.reply_content
    # row = db(db.post.post_id == post_id).select()
    # row.first().update_record(post_content = updated_post_content)
    db.reply.update_or_insert(
        (db.reply.id == reply_id) & (db.reply.reply_author == auth.user.email),
        reply_content = updated_reply_content
    )
    return response.json(dict(post_content=updated_reply_content))

@auth.requires_signature()
def set_like():
    post_id = int(request.vars.post_id)
    like_status = request.vars.like.lower().startswith('t')
    if like_status:
        db.user_like.update_or_insert(
            (db.user_like.post_id == post_id) & (db.user_like.user_email == auth.user.email),
            post_id = post_id,
            user_email = auth.user.email
        )
    else:
        db((db.user_like.post_id == post_id) & (db.user_like.user_email == auth.user.email)).delete()
    return "ok" # Might be useful in debugging.

@auth.requires_signature()
def set_dislike():
    post_id = int(request.vars.post_id)
    dislike_status = request.vars.dislike.lower().startswith('t')
    if dislike_status:
        db.user_dislike.update_or_insert(
            (db.user_dislike.post_id == post_id) & (db.user_dislike.user_email == auth.user.email),
            post_id = post_id,
            user_email = auth.user.email
        )
    else:
        db((db.user_dislike.post_id == post_id) & (db.user_dislike.user_email == auth.user.email)).delete()
    return "ok" # Might be useful in debugging.

def vote_count(post_id):
    """Gets the list of people who liked a post."""
    # We get directly the list of all the users who liked the post.
    like_count = int(db(db.user_like.post_id == post_id).count())
    dislike_count = int(db(db.user_dislike.post_id == post_id).count())
    net_count = like_count - dislike_count
    # We return this list as a dictionary field, to be consistent with all other calls.
    return net_count

def get_user_email():
    user_email = "None" if auth.user is None else auth.user.email
    return response.json(dict(user_email=user_email))
