#!/bin/sh

uptime --pretty | sed 's/up //' | sed 's/\ weeks\?,/w/' | sed 's/\ days\?,/d/' | sed 's/\ hours\?,\?/h/' | sed 's/\ minutes\?/m/'

#import psutil
#import time
#import datetime


#def uptime():
#  diff: float =  time.time() - psutil.boot_time()
#  delta = datetime.timedelta(seconds=diff)
#  return delta  


#print(type(uptime()), uptime()) 
