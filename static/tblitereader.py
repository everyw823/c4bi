# -*- coding: UTF-8 -*-

from sqlite3 import Connection, Cursor
import sqlite3
from datetime import datetime, timedelta
import json

import sys
import io
import ast

mdbreak = "\n\n"

global root_id;
root_id = 0;

for stream in (sys.stdout, sys.stderr):
    if not hasattr(stream, "reconfigure"):
        stream = io.TextIOWrapper(stream.buffer, encoding="utf-8", errors="backslashreplace")


def parse_content_according_to_type(d:dict[str, str | None]) -> dict[str, str | None] | None:
    try:
        if d['type'] == 1:
            return {
                "t" : "text",
                "v" : d.get('text')
            }
            # text
        elif d['type'] == 2:
            return {
                "t" : "emoji",
                "v" : d.get('id')
            }
            # emoji
        elif d['type'] == 3:
            return {
                "t" : "image",
                "v" : d.get('filename')
            }
            # image
        else:
            return None

    except json.JSONDecodeError:
        return None
    

def markdownify(content:dict[str, str | None]) -> str | None:
   
    if content['v'] is None:
        return None
    else:
        if content['t'] == 'text':
            return mdbreak.join(content['v'].split("\\n"));
        elif content['t'] == 'emoji':
            return f"emoji: {content['v']}:"
        elif content['t'] == 'image':
            return f"![{content['v']}](../img/{content['v']}){mdbreak}"





class Thread:

    def __init__(self, id:int,  content:str, create_time:datetime):
        self.id:int = id
        self.create_time:datetime = create_time
        self.content:str = content
        self.children:list[Thread] = []

    def add_child(self, child:Thread):
        self.children.append(child)

    def get_content_list(self):
        return ast.literal_eval(self.content)

    def parse(self)  -> str | None:
        cs = self.get_content_list()
        md = ""

        for c in cs:
            parsed = parse_content_according_to_type(c)
            if parsed and parsed['v']:
                mdified = markdownify(parsed)
                if parsed and mdified:
                    md = md + mdified

        return md




def main():
    filepath: str = input("Enter the path to the SQLite database file: ")
    # filepath: str = "/home/hkm/Desktop/content.db" # for testing
    conn: Connection = sqlite3.connect(filepath)
    cursor: Cursor = conn.cursor()
    cursor.execute("SELECT contents,create_time,id,parent_id FROM post")
    rows: list[tuple[str, int, int, int]] = cursor.fetchall()
    threads: dict[int, Thread] = {}

    cursor.execute("SELECT v from db_info where k = 'thread_id'")
    root_id = cursor.fetchone()[0]

    for row in rows:

        th: Thread = Thread(row[2],row[0], datetime.fromtimestamp(row[1]))
        if row[3] == 0:
            threads[row[2]] = th
        else:
            parent: Thread = threads[row[3]]
            parent.add_child(th)

    # savefolder = input("Enter the path to the folder where the markdown files will be saved: ")
    savefolder: str = "/home/hkm/Documents/coding/blog_related_stuffs/c4bi/exampleSite/content/posts/"+root_id+"/" # for testing

    # used for debugging

    for thread in threads.values():

        markdownified_content = thread.parse()


        if markdownified_content is None:
            print("No content found for thread with ID: ")
            continue
        
        filename = 'Miscellaneous' + thread.create_time.strftime("%Y-%m-%d") + ".md"
        with open(savefolder + "/" + filename, "w", encoding="utf-8", errors="replace") as md:
            md.write("""+++
title = 'Miscellaneous""" + thread.create_time.strftime("%Y-%m-%d") + """'
author = 'Home'
date = """ + thread.create_time.strftime("%Y-%m-%dT%H:%M:%S+08:00") + """
categories = ['Miscellaneous']
tags = ['misc']""" + """
sources = ['""" + root_id + """']
+++

"""
            + "<time class='main-time' datetime='" + thread.create_time.strftime("%Y-%m-%dT%H:%M:%S+08:00") + "'>" + thread.create_time.strftime("%H:%M:%S") +"</time>" + "\n"
            + markdownified_content + mdbreak
            )
            if thread.children :
                for child in thread.children:

                    markdownified_content = child.parse()

                    if markdownified_content is None:
                       print("No content found for thread with ID: ")
                       continue

                    if( child.create_time.day != thread.create_time.day ):
                        md.write( "<time class='reply-time' datetime='" + child.create_time.strftime("%Y-%m-%dT%H:%M:%S+08:00") + "'>" + child.create_time.strftime("%Y-%m-%dT%H:%M:%S +08:00") +"</time>" + "\n")
                    else:
                        md.write("<time class='reply-time' datetime='" + child.create_time.strftime("%Y-%m-%dT%H:%M:%S+08:00") + "'>" + child.create_time.strftime("%Y-%m-%dT%H:%M:%S +08:00") +"</time>" + "\n")

                    md.write(markdownified_content + mdbreak);
            



        # inner = row[0].split("\"")[5]
        # file md = open()
        
        # print(datetime.fromtimestamp(row[1]).strftime("%Y-%m-%dYT%H:%M+08:00"))


main();