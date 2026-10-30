# -*- coding: UTF-8 -*-

from sqlite3 import Connection, Cursor
import sqlite3
from datetime import datetime
import json
import os, shutil, sys, io
import ast

mdbreak = "\n\n"


root_id = 0;

for stream in (sys.stdout, sys.stderr):
    if not hasattr(stream, "reconfigure"):
        stream = io.TextIOWrapper(stream.buffer, encoding="utf-8", errors="backslashreplace")


def parse_content_according_to_type(content:dict[str, str | None]) -> dict[str, str | None] | None:
    try:
        if content['type'] == 1:
            return {
                "t" : "text",
                "v" :content.get('text')
            }
            # text
        elif content['type'] == 2:
            return {
                "t" : "emoji",
                "v" : content.get('id')
            }
            # emoji
        elif content['type'] == 3:
            return {
                "t" : "image",
                "v" : content.get('filename'),
                "width" : content.get('show_width'),
                "height" : content.get('show_height')
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
            c = mdbreak.join(content['v'].split("\\n"))

            return c

        elif content['t'] == 'emoji':
            return f"emoji: {content['v']}:"
        elif content['t'] == 'image':
            return f"""{mdbreak}![{content['v']}]({content['v']})
{{width=\"{content['width']}\"}}"""



class TiebaThread:

    def __init__(self, id:int,  content:str, create_time:datetime):
        self.id:int = id
        self.create_time:datetime = create_time
        self.content:str = content
        self.children:list[TiebaThread] = []

    def add_child(self, child:TiebaThread):
        self.children.append(child)

    def get_content_list(self):
        return ast.literal_eval(self.content)

    def parse(self)  -> str | None:
        cs = self.get_content_list()
        md = ""

        for c in cs:
            parsed = parse_content_according_to_type(c)
            if parsed:
                mdified = markdownify(parsed)
                if mdified:
                    md = md + mdified
            
        return md

    def place_image(self,post_path:str,save_path:str):
        cs = self.get_content_list()
        for c in cs:
            if c['type'] == 3:
                if c['filename']:
                    source_filename = os.path.join(post_path,"post_assets","images",c['filename'])
                    target_filename: str = os.path.join(save_path,c['filename'])
                    shutil.copy(source_filename,target_filename)
                else:
                    print("图片不存在!!!")




def main():

    global root_id

    filepath= input("Enter the path to the SQLite database file: ")
    
    conn: Connection = sqlite3.connect(os.path.join(filepath, "content.db"))
    cursor: Cursor = conn.cursor()
    cursor.execute("SELECT contents,create_time,id,parent_id FROM post")
    rows: list[tuple[str, int, int, int]] = cursor.fetchall()
    threads: dict[int, TiebaThread] = {}

    cursor.execute("SELECT v from db_info where k = 'thread_id'")
    root_id = cursor.fetchone()[0]

    for row in rows:

        th: TiebaThread = TiebaThread(row[2],row[0], datetime.fromtimestamp(row[1]))
        if row[3] == 0:
            threads[row[2]] = th
        else:
            parent: TiebaThread = threads[row[3]]
            parent.add_child(th)

    # savefolder = input("Enter the path to the folder where the markdown files will be saved: ")
    savepath = "/home/hkm/Documents/coding/c4bi/exampleSite/content/posts/"+root_id # for testing
    # used for debugging

    for thread in threads.values():



        markdownified_content = thread.parse()


        if markdownified_content is None:
            print("No content found for thread with ID: ")
            continue
        
        dirpath = os.path.join(savepath, str(thread.id))
        
        if not os.path.exists(dirpath) : os.mkdir(dirpath)

        thread.place_image(filepath, dirpath);

        with open(os.path.join(dirpath , "index.md"), "w+", encoding="utf-8", errors="replace") as md:
            md.write("""+++
title = 'Miscellaneous""" + thread.create_time.strftime("%Y-%m-%d") + """'
author = 'Home'
date = """ + thread.create_time.strftime("%Y-%m-%dT%H:%M:%S+08:00") + """
categories = ['Miscellaneous']
tags = ['archive']""" + """
sources = ['""" + root_id + """']
+++

"""
            + markdownified_content + mdbreak + "<!--more-->" + mdbreak
            )

            if thread.children : # 百度贴吧没有针对帖子回复之回复的回复（孙级回复），所以这里只处理子级回复
                for child in thread.children:

                    markdownified_content = child.parse()

                    if markdownified_content is None:
                       print("No content found for thread with ID: ")
                       continue

                    if( child.create_time.day != thread.create_time.day ):
                        md.write( "<time class='time-interval' datetime='" + child.create_time.strftime("%Y-%m-%dT%H:%M:%S+08:00") + "'>" + child.create_time.strftime("%Y-%m-%dT%H:%M:%S +08:00") +"</time>" + "\n")
                    else:
                        md.write("<time class='time-interval' datetime='" + child.create_time.strftime("%Y-%m-%dT%H:%M:%S+08:00") + "'>" + child.create_time.strftime("%Y-%m-%dT%H:%M:%S +08:00") +"</time>" + "\n")

                    md.write(markdownified_content  + mdbreak)

            # md.write("<hr>"+ mdbreak +f"*这是一篇来自其他网站的存档。* [在这里查看原始内容](https://tieba.baidu.com/p/{root_id}?pid={thread.id})" + mdbreak + f"<div class='link-caution'><strong>注意！</strong><details><summary><strong>警告</strong>：主观臆断 & 言辞激烈的内容</summary><p>您可以相信我的观点、或是认为我是戴着锡箔纸帽子的阴谋论者。但如果可以的话，请您抽出时间阅读这些内容。</p><p>百度贴吧是对移动端网页用户不友好的典范，其移动端网页中“ 下载 App ”的入口无孔不入——甚至只是滚动页面也会触发下载，您无法正常地浏览任何内容。</p><p>他们臃肿的专有 App 充斥着AI泔水和垃圾广告，会积极地推荐争夺注意力、引发焦虑的帖子，是不折不扣的恶意软件。<p>扩展阅读：<ul><li><a rel='external' href='https://www.gnu.org/proprietary/proprietary.html'>专有软件常常是恶意软件</a>（在国内，所有的“官方App”都是专有软件）</li><li><a rel='external' href='https://www.gnu.org/proprietary/proprietary-addictions.html'>专有成瘾性恶意软件的特征</a></li><li>引用资料的观点不代表本站及站长的观点。</li></ul></p></p></details><p>如果您使用安卓系统且想要浏览原始内容，您可以使用<a rel='external' href='https://github.com/zzc10086/TiebaLite'>这个</a>开源替代品。</p></div>")

main();