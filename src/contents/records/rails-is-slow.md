---
title: "Rails Is Slow"
viewTemplate: "record"
timeStamp: "2021-10-24T18:02:00+08:00"
---

# Rails Is Slow

Rails is slow, is what you hear from people when they complain about how under performing a Rails application is, but why is Rails slow? I've heard various kind of response from people over time, "because Ruby is slow", "Because Rails is bloated" but is that true? That is what I will attempt to demystify in this post by performing some simple test.

## The Test

I have decided to perform the test by having just Rails out of the box as it is with 2 different Rack application server which I think are the most commonly used among Rails deployment, [Unicorn](https://github.com/defunkt/unicorn) and [Puma](https://github.com/puma/puma).

What I am testing here is the request per second handled the application server, specifically the the application logic. What I am not testing here is serving of static assets which any experienced Rails developer should know is best fulfilled by Nginx.

For the test I have prepared 2 endpoints:
- `/` will just respond with 'hello world'
- `/simulated_io?delay=1` will respond with 'simulated io' after `delay` amount of seconds.

To test the endpoints I will be sending traffic to them with [Plow](https://github.com/six-ddc/plow).

In order for the test to be as transparent as possible I've made a [GitHub repository](https://github.com/Magi-KS/rails-benchmark) that you can use to run the test on your own machine with ease because it is dockerized.

## Rails With Unicorn

The first test will be Unicorn with `1 worker and 1 CPU`, which can be started after building the image with:
```bash
docker run -p 8080:3000 --cpus 1 -e RAILS_ENV=production magi-ks-rails-benchmark bundle exec unicorn -c config/unicorn.conf
```
testing with the `/` endpoint with `1 concurrent connection`:
```bash
docker run --rm --net=host ghcr.io/six-ddc/plow -c 1 'http://localhost:8080/'
```
we get this result:
```bash
  Elapsed    37.564s
  Count        20955
    2xx        20955
  RPS        557.834
  Reads    0.292MB/s
  Writes   0.031MB/s

Statistics   Min     Mean    StdDev    Max
  Latency   1.32ms  1.786ms  407µs   17.923ms
  RPS       526.04  557.79   11.96    578.05

Latency Percentile:
  P50        P75      P90      P95      P99    P99.9    P99.99
  1.725ms  1.865ms  2.064ms  2.295ms  2.934ms  8.06ms  14.606ms

Latency Histogram:
  1.714ms   16829  80.31%
  1.943ms    3244  15.48%
  2.278ms     623   2.97%
  2.956ms     235   1.12%
  4.851ms      13   0.06%
  9.192ms       6   0.03%
  10.99ms       4   0.02%
  14.606ms      1   0.00%
```
557 request per second, looks pretty good keep in mind this is without any complicated application logic, taking into account application logic it can easily fall to 20% of this throughput.

now lets try the `/simulated_io` endpoint with `delay of 1 second` and `concurrency of 1`:
```bash
docker run --rm --net=host ghcr.io/six-ddc/plow -c 1 'http://localhost:8080/simulated_io?delay=1'
```
and the result we got is:
```bash
  Elapsed     42.44s
  Count           42
    2xx           42
  RPS          0.990
  Reads    0.001MB/s
  Writes   0.000MB/s

Statistics    Min       Mean     StdDev     Max
  Latency   1.00556s  1.007463s  868µs   1.009704s
  RPS         0.49      0.98      0.07       1

Latency Percentile:
  P50         P75        P90        P95        P99       P99.9     P99.99
  1.0076s  1.008028s  1.008325s  1.008532s  1.009704s  1.009704s  1.009704s

Latency Histogram:
  1.005696s   3   7.14%
  1.006784s  10  23.81%
  1.007571s  17  40.48%
  1.007958s   5  11.90%
  1.008378s   5  11.90%
  1.009067s   2   4.76%
```
## The Performance Thief
nearly 1 request per second! what happened here? Ruby is slow? Rails is slow? it is neither. It has more to do with how IO is handled by the process, IO here can be anything from Network IO to Disk IO. When the code executes to the point where it needs to perform IO it needs to wait for the result of the IO before being able to continue with the code execution.

What really happened here is that we simulated IO with the `sleep` system call which tells the OS scheduler to not run the process until after 1 second has passed, with an actual IO operation it'll be similar because the process would be waiting for the IO result and not able to continue execution until the IO result is returned.

Ok so the IO is blocking the code execution for that particular request the process can handle other request at the mean time yes?

let's try it out with `/simulated_io` endpoint with `delay of 1 second` and `concurrency of 5`:
```bash
docker run --rm --net=host ghcr.io/six-ddc/plow -c 5 'http://localhost:8080/simulated_io?delay=1'
```
We get this result:
```bash
  Elapsed   1m2.331s
  Count           61
    2xx           61
  RPS          0.979
  Reads    0.001MB/s
  Writes   0.000MB/s

Statistics     Min       Mean      StdDev      Max
  Latency   1.006888s  4.868341s  692.09ms  5.036783s
  RPS         0.49       0.99       0.06        1

Latency Percentile:
  P50           P75        P90        P95        P99       P99.9     P99.99
  5.032965s  5.034704s  5.035542s  5.036034s  5.036783s  5.036783s  5.036783s

Latency Histogram:
  1.006888s   1   1.64%
  2.014008s   1   1.64%
  3.019441s   1   1.64%
  4.025659s   1   1.64%
  5.031101s   9  14.75%
  5.032392s  20  32.79%
  5.034354s  19  31.15%
  5.035819s   9  14.75%
```
Still about 1 second per request but wait, the average response time have gone up to 5 seconds! what happened here? The problem here is that the Unicorn application server is only able to handle 1 request at a time, if the request needs to wait for 1 second for the IO to complete then the next request inline will have to wait for the first request to finish and the 3rd request would have o wait for both the first and second request to finish before being processed and so on.

"This is why Rails can't scale!" you might shout but that is not entirely true. If we take "scaling" as being able to handle X amount of request per second then all you need to do is to increase the worker count.

Starting the Unicorn application server with `1 CPU and 5 worker`:
```bash
docker run -p 8080:3000 --cpus 1 -e RAILS_ENV=production -e WORKER_COUNT=5 magi-ks-rails-benchmark bundle exec unicorn -c config/unicorn.conf
```
Then we hit `/simulated_io` endpoint with the same `delay of 1 second` and `concurrency of 5`:
```bash
docker run --rm --net=host ghcr.io/six-ddc/plow -c 5 'http://localhost:8080/simulated_io?delay=1'
```
Result:
```bash
Summary:
  Elapsed    30.523s
  Count          150
    2xx          150
  RPS          4.914
  Reads    0.003MB/s
  Writes   0.000MB/s

Statistics     Min       Mean     StdDev      Max
  Latency   1.003883s  1.008427s  4.677ms  1.033041s
  RPS         2.49       4.91      0.46        5

Latency Percentile:
  P50           P75        P90        P95        P99       P99.9     P99.99
  1.007395s  1.008314s  1.009335s  1.019545s  1.032231s  1.033041s  1.033041s

Latency Histogram:
  1.005962s  19  12.67%
  1.007085s  63  42.00%
  1.008411s  56  37.33%
  1.012531s   7   4.67%
  1.024546s   1   0.67%
  1.025855s   1   0.67%
  1.030089s   1   0.67%
  1.032636s   2   1.33%
```
Cool we get 5 request per second even with the simulated IO, all we gotta do is to have the amount of worker that is equivalent to the highest concurrent request we'll ever get, problem solved.

While that is correct but what is the cost? Unicorn creates more worker by process forking each process would require their own memory space. An average Rails application would be around 200MB per process so if you need to be able to handle 100 concurrent request then you will need at least `100 * 200MB` or memory available which is `20GB` of `RAM` just to handle 100 concurrent request within 1 second.

Well that sounds expensive to run but it scales I guess, no choice but to fork the cash over to the cloud provider. Well no so fast, Unicorn isn't the only Rack application server available, we have also Puma.

## Rails With Puma

Puma is the default application server for Rails since Rails 5 and there is a good reason for it. Puma is able to have worker thread, a thread requires a lot less memory to maintain compared to a another process. So puma is be able to achieve what Unicorn is able to achieve with much less memory requirement.

Let's do some test, we can start up `Puma` with `1 CPU and 100 thread`:
```bash
docker run -p 8080:3000 --cpus 1 -e RAILS_MAX_THREADS=100 -e RAILS_ENV=production magi-ks-rails-benchmark bundle exec rails s -b 0.0.0.0
```
And hit the `simulated_io` endpoint with `delay of 1 second` and `concurrency of 100`:
```bash
docker run --rm --net=host ghcr.io/six-ddc/plow -c 100 'http://localhost:8080/simulated_io?delay=1'
```
Then we inspect the container's stats with `docker stats`:
```bash
CONTAINER ID   NAME               CPU %     MEM USAGE / LIMIT    MEM %     NET I/O           BLOCK I/O     PIDS
7bed122ecc9e   xenodochial_pike   40.05%    140.4MiB / 15.4GiB   0.89%     1.09MB / 4.53MB   0B / 8.66MB   107
```
Result from Plow:
```bash
  Elapsed  1m22.712s
  Count         8090
    2xx         8090
  RPS         97.809
  Reads    0.046MB/s
  Writes   0.007MB/s

Statistics     Min       Mean     StdDev      Max
  Latency   1.001338s  1.015458s  28.11ms  1.314588s
  RPS         49.98      98.5      6.04      100.1

Latency Percentile:
  P50           P75        P90        P95        P99       P99.9     P99.99
  1.006184s  1.013806s  1.035318s  1.054969s  1.164423s  1.279384s  1.314588s

Latency Histogram:
  1.00544s   4242  52.44%
  1.010906s  2314  28.60%
  1.027732s   916  11.32%
  1.058625s   459   5.67%
  1.11265s    116   1.43%
  1.260034s    37   0.46%
  1.285833s     5   0.06%
  1.314588s     1   0.01%
```
So we manged to achieve 100 request per second even with the simulated IO workload by having 100 worker thread, and all the request was served in about 1 second. For comparison sake let's try to achieve the same thing with Unicorn.

`Unicorn` with `1 CPU and 100 workers`:
```bash
docker run -p 8080:3000 --cpus 1 -e RAILS_ENV=production -e WORKER_COUNT=100 magi-ks-rails-benchmark bundle exec unicorn -c config/unicorn.conf
```
Plow hitting `simulated_io` endpoint with `100 concurrency`:
```bash
docker run --rm --net=host ghcr.io/six-ddc/plow -c 100 'http://localhost:8080/simulated_io?delay=1'
```
Docker stats:
```bash
CONTAINER ID   NAME                CPU %     MEM USAGE / LIMIT    MEM %     NET I/O           BLOCK I/O        PIDS
bb46d11eaa1d   beautiful_neumann   68.40%    4.069GiB / 15.4GiB   26.41%    5.32MB / 10.4MB   209kB / 12.4MB   202
```
Plow result:
```bash
  Elapsed  2m44.102s
  Count        15497
    2xx        15497
  RPS         94.435
  Reads    0.049MB/s
  Writes   0.007MB/s

Statistics     Min       Mean     StdDev       Max
  Latency   1.002559s  1.05568s  379.318ms  7.698262s
  RPS         14.99     94.92      15.69     100.12

Latency Percentile:
  P50           P75        P90        P95       P99      P99.9     P99.99
  1.008493s  1.009552s  1.010977s  1.080642s  2.99003s  6.60033s  7.698262s

Latency Histogram:
  1.018072s  15219  98.21%
  1.520166s    138   0.89%
  3.486064s     50   0.32%
  4.470955s     43   0.28%
  5.667286s     23   0.15%
  6.176949s     12   0.08%
  7.030209s     11   0.07%
  7.698262s      1   0.01%
```
Look at that memory usage difference between Unicorn and Puma 4GB VS 140MB and Unicorn have some hiccups with some request taking up to 7 seconds to serve. Keep in mind these are the result of this synthetic benchmark to illustrate an example, real world result might be slightly different but in line with what we see here.

Well I guess all we need to do is to switch to Puma and add lots of worker thread, yes but there's a catch you need to make sure your application is `thread safe` if you wish to use Puma worker thread. Rails and its dependency are `thread safe` since Rails 3 but you need to make sure that the Gems that you depend on are `thread safe` on your own.

What does `thread safe` mean? Because different thread can run at different time we need to make sure that there are no shared state between the thread. A mundane example would be a global variable that your code depends on if 1 request stores a temporary variable that it needs to perform a task on the global variable then the OS scheduler decides to swap the thread out to work on another thread that also writes to the same global variable then when the original thread gets swapped back to continue running the value stored on the global variable might not be what we wanted any more. This can be a huge pain to debug as we may not know exactly how it happens.

So what have we learned here?
- Ruby/Rails is not slow.
- The way Ruby/Rails handles IO is the main culprit of slowness.
- Rails can scale with Unicorn workers albeit inefficient.
- Inefficiency can be addressed with use Puma and worker thread.
- Thread safety is a requirement in order to safely use Puma worker thread.

"That is a lot of things and caveats to know about to get performant Rails" you may think but this is only the most common case, there are other ways to squeeze performance out of Ruby and Rack applications.

This concludes the brief look through on why Rails is slow, the GitHub repository to run the benchmark shown in the post is located [here](https://github.com/Magi-KS/rails-benchmark) feel free to play around or use it to spread the knowledge.
