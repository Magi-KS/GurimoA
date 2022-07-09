---
title: "OS, process, thread, memory"
viewTemplate: "record"
timeStamp: "2022-07-09T17:05:39+08:00"
---
# OS, process, thread, memory

Today I'd like to talk about how a program is executed on a modern computer.

The essential components necessary to perform any form of computing are memory and CPU. The program is stored in the memory and the CPU would access then execute the program. The result of the execution of a program can then be stored in the memory.

In the early days of computing, programs are crafted to be ran on the CPU directly, once the computer is powered on it starts executing the program from memory, if one wishes to run a different program one would need to power off the computer, swap out the program cartridge(swappable memory module holding the program) and then power on the computer. That is really inefficient you may think, but at that time it is an acceptable norm.

Over time as computers got more powerful, people realized that the CPU spent a lot of time idling and software developers were writing a lot of boilerplate code interacting with the hardware. The solution to that is to have an abstraction layer that can swap programs in and out to be executed and APIs to interact with the hardwares, that is what we refer to as the Operating System(OS). 

Almost all modern computers that you interact with have an OS running in it, the OS is the reason you’re able to browse the internet while listening to music on Spotify at the same time. Although to us the program appears to be running at the same time, that may not be the case especially when your computer has only a single core(execution unit).

The programs that you run on a computer with OS are identified as processes, whenever you execute a program the OS allocates the memory required to execute the program and then the scheduler decides when the process is going to run.

Each process has its own memory space that starts from 0x00000000 to whatever address size the CPU is capable of handling, 0xFFFFFFFF for a 32 bit CPU for example. You may be wondering how it is possible that processes are able to to share their address space, but they are in fact not sharing the same address space, processes does not have direct access to the physical memory, the address space that they are using is called virtual memory that is mapped to the physical memory by the OS, each process’ virtual memory are actually isolated from each other.

A single core in the CPU is only able to execute a single thread at a time(let’s not talk about hyperthreading for this explanation). A thread is the execution context of a process, you may think of it as a pointer to the address where the current code is being executed. Usually a process starts off with a single thread but it is possible to have multiple threads for a single process by using the OS’ system call to create more threads.

Where a process may benefit from having multiple threads is usually when there is a need to call a blocking system call(usually IO related) and processing data independent of the other thread. 

Whenever a thread performs a blocking system call the execution of that thread is halted until the system call is completed, this can be a bad experience for the user, this can be solved by calling the blocking system call on a separate thread so that the main thread is not halted, this approach is beneficial even when there is only a single core available.

In cases where we need to process data that are independent of each other, for example painting a whole image black(setting byes to 0), it is beneficial to create as many threads as there is cpu core available and dividing up the image region where each thread is responsible for, this allow the work to be executed parallely therefore speeding up the execution time.

## epilogue
This is a rough explanation that aims to assist in a better understanding of the basics of how OS, process, thread, memory work together to execute a computer program. I hope that this has helped you to gain some insights of how a computer program is executed.

## recommended materials to gain further understanding.
- [The Evolution Of CPU Processing Power](https://www.youtube.com/playlist?list=PLC7a8fNahjQ8IkiD5f7blIYrro9oeIfJU)
- [Operating Systems: Crash Course Computer Science #18](https://www.youtube.com/watch?v=26QPDBe-NB8)
- [Memory & Storage: Crash Course Computer Science #19](https://www.youtube.com/watch?v=TQCr9RV7twk)
- [Files & File Systems: Crash Course Computer Science #20](https://www.youtube.com/watch?v=KN8YgJnShPM)
