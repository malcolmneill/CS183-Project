# -*- coding: utf-8 -*-
# this file is released under public domain and you can use without limitations

# -------------------------------------------------------------------------
# This is a sample controller
# - index is the default action of any application
# - user is required for authentication and authorization
# - download is for downloading files uploaded in the db (does streaming)
# -------------------------------------------------------------------------

import datetime


def index():
    result = [] # We will accummulate the result here.
    for r in db(db.post.id > 0).select():
        # This is a loop over all the posts.

        # Each post can have replies; you need to read here the list of replies.
        # As each reply has an author and a content, a list of dictionaries seems
        # appropriate here.
        reply_list=[]
        replies = db(db.reply.post_id == r.id).select(orderby=db.reply.reply_time)
        for reply in replies:
            reply_list.append(dict(
                reply_id = reply.id,
                reply_author = reply.reply_author,
                reply_content = reply.reply_content,
            ))

        result.append(dict(
            post_title=r.post_title,
            post_author=r.post_author,
            post_content=r.post_content,
            reply_list=reply_list,
            id=r.id,
        ))

    logger.info("Result: %r" % result)
    return dict(rows=result)


@auth.requires_login()
def add_reply():
    
    # You will be creating a form, in some way, e.g. using SQLFORM, and you will write
    # BEFORE processing the form:
    # form.vars.post_id == int(request.args[0])
    db.reply.reply_author.readable = False

    form = SQLFORM(db.reply)
    form.vars.post_id = int(request.args[0])
    if form.process().accepted:
        redirect(URL('default', 'index'))
    logger.info("My session is: %r" % session)
    return dict(form=form)


@auth.requires_login()
@auth.requires_signature()
def edit_reply():
    
    db.reply.reply_author.readable = False
    db.reply.id.readable = False
    db.reply.reply_time.writable = False
    db.reply.reply_time.readble= False 

    reply = db.reply(request.args(0))
    
    if reply is None:
        logging.info("Invalid edit call")
        redirect(URL('default', 'index'))
    if reply.reply_author != auth.user.email:
        logging.info("Attempt to edit some one else's reply by: %r" % auth.user.email)
        redirect(URL('default', 'index'))
    form = SQLFORM(db.reply, record=reply)
    if form.process().accepted:
        redirect(URL('default', 'index'))
    return dict(form=form)


@auth.requires_login()
@auth.requires_signature()
def delete_reply():
    
    reply = db.reply(request.args(0))
    if reply is None:
        logging.info("Invalid edit call")
        redirect(URL('default', 'index'))
    if reply.reply_author != auth.user.email:
        logging.info("Attempt to edit some one else's reply by: %r" % auth.user.email)
        redirect(URL('default', 'index'))
    form = SQLFORM(db.reply, record=reply)
    if form.process().accepted:
        redirect(URL('default', 'index'))
    db(db.reply.id == reply.id).delete()


@auth.requires_login()
def add():
    """More sophisticated way, in which we use web2py to come up with the form."""
    form = SQLFORM(db.post)
    # We can process the form.  This will check that the request is a POST,
    # and also perform validation, but in this case there is no validation.
    # THIS process() also inserts.
    if form.process().accepted:
        redirect(URL('default', 'index'))
    # We ask web2py to lay out the form for us.
    logger.info("My session is: %r" % session)
    return dict(form=form)


# We require login.
@auth.requires_login()
def edit():
    """Allows editing of a post.  URL form: /default/edit/<n> where n is the post id."""

    # For this controller only, we hide the author.
    db.post.post_author.readable = False

    post = db.post(request.args(0))
    # We must validate everything we receive.
    if post is None:
        logging.info("Invalid edit call")
        redirect(URL('default', 'index'))
    # One can edit only one's own posts.
    if post.post_author != auth.user.email:
        logging.info("Attempt to edit some one else's post by: %r" % auth.user.email)
        redirect(URL('default', 'index'))
    # Now we must generate a form that allows editing the post.
    form = SQLFORM(db.post, record=post)
    if form.process().accepted:
        # The deed is done.
        redirect(URL('default', 'index'))
    return dict(form=form)
    
#@auth.requires_signature()
@auth.requires_login()
@auth.requires_signature()
def delete():
    post = db.post(request.args(0))
    # We must validate everything we receive.
    if post is None:
        logging.info("Invalid edit call")
        redirect(URL('default', 'index'))
    # One can edit only one's own posts.
    if post.post_author != auth.user.email:
        logging.info("Attempt to edit some one else's post by: %r" % auth.user.email)
        redirect(URL('default', 'index'))
    db(db.post.id == post.id).delete()
    redirect(URL('default', 'index'))

def user():
    """
    exposes:
    http://..../[app]/default/user/login
    http://..../[app]/default/user/logout
    http://..../[app]/default/user/register
    http://..../[app]/default/user/profile
    http://..../[app]/default/user/retrieve_password
    http://..../[app]/default/user/change_password
    http://..../[app]/default/user/bulk_register
    use @auth.requires_login()
        @auth.requires_membership('group name')
        @auth.requires_permission('read','table name',record_id)
    to decorate functions that need access control
    also notice there is http://..../[app]/appadmin/manage/auth to allow administrator to manage users
    """
    return dict(form=auth())


@cache.action()
def download():
    """
    allows downloading of uploaded files
    http://..../[app]/default/download/[filename]
    """
    return response.download(request, db)


def call():
    """
    exposes services. for example:
    http://..../[app]/default/call/jsonrpc
    decorate with @services.jsonrpc the functions to expose
    supports xml, json, xmlrpc, jsonrpc, amfrpc, rss, csv
    """
    return service()


