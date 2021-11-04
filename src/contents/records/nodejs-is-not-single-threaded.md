---
title: "NodeJS Is Not Single Threaded"
viewTemplate: "record"
timeStamp: "2021-11-04T18:56:23+08:00"
---
# NodeJS Is Not Single Threaded

NodeJS is not single threaded, you may have heard that NodeJS is single threaded but that is an incorrect statement, the event loop in NodeJS where JS code runs is single threaded. We can confirm the fact by running NodeJS and checking the thread count.

Run NodeJS:
```bash
node
```
Then we hit `C-z` which is `CRTL+z` for those unfamiliar, this suspends the process that is currently in the foreground and drops you back to your shell.

Now we can run `htop`, an interactive process viewer:
```bash
htop
```
We can see this:
```bash
 9 root       20   0  595M 33124 26232 T  0.0  0.2  0:00.04 ├─ node
10 root       20   0  595M 33124 26232 T  0.0  0.2  0:00.00 │  ├─ node
11 root       20   0  595M 33124 26232 T  0.0  0.2  0:00.00 │  ├─ node
12 root       20   0  595M 33124 26232 T  0.0  0.2  0:00.00 │  ├─ node
13 root       20   0  595M 33124 26232 T  0.0  0.2  0:00.00 │  ├─ node
14 root       20   0  595M 33124 26232 T  0.0  0.2  0:00.00 │  ├─ node
15 root       20   0  595M 33124 26232 T  0.0  0.2  0:00.00 │  ├─ node
16 root       20   0  595M 33124 26232 T  0.0  0.2  0:00.00 │  ├─ node
17 root       20   0  595M 33124 26232 T  0.0  0.2  0:00.00 │  ├─ node
18 root       20   0  595M 33124 26232 T  0.0  0.2  0:00.00 │  ├─ node
19 root       20   0  595M 33124 26232 T  0.0  0.2  0:00.00 │  └─ node
```
That doesn't look like a single thread does it?

To properly terminate the NodeJS process that was suspended we exit `htop` with `q` then we execute `fg`, which brings a background process to the foreground then we hit `C-d`/`CTRL-d` which will cause NodeJS to exit.

So, Why does NodeJS has that many threads? Isn't a single thread enough since JS code only runs in a single threaded event loop? My initial thought was that it is used to handle IO asynchronously like network and disk IO, but it turns out I was wrong.

Those extra threads are what NodeJS calls worker pool, they are used to handle "expensive" tasks like IO which does not have a non-blocking version provided by the OS, and CPU intensive tasks. Network IO is not handled by the worker pool, instead it is handled on the event loop utilizing `epoll` for asynchronous IO. `epoll` is a Linux system call that allows a process to tell the OS which file descriptor that process is interested in, and receives a notification when the resource is ready for read or write.

I recommend reading this [doc](https://nodejs.org/en/docs/guides/dont-block-the-event-loop/#a-quick-review-of-node) and this [video](https://www.youtube.com/watch?v=P9csgxBgaZ8) by NodeJS for a more in-depth look into this topic.
