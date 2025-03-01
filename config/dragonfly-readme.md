## Dragon Fly

These flags are used as best practice for BullMQ

```
--cluster_mode=emulated
--lock_on_hashtags
```

---

The memory and threads is limited to support lower powered machines initially.
These can be increased if more performance is needed.

```
--maxmemory=1024MiB
--proactor_threads=2
```

---

Snapshots are saved with the cron job. The file name is set to only keep the latest snapshot.

```
--snapshot_cron=*/15 * * * *
--dbfilename=dump
```
