# Pal

C implementation of PalDB.


## Limitations

+ Bytes only API.
+ Memory mapping is always active.
+ Read only.


## Performance

Read throughputs for different index sizes (each key ~10 bytes):

+ 1e2 keys: 8.1e6 reads/sec.
+ 1e4 keys: 6.4e6 reads/sec.
+ 1e6 keys: 2.7e6 reads/sec.
