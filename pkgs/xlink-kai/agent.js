
// with this, we can join the chat without segfault
// and get the faulty access-violation context.
Process.setExceptionHandler(function (details) {

  // stop on undocumented or non-recoverable interruptions
  var bcontinue = Boolean(false);

  try {

    // Interceptor.attach(details.address, {
    //   onEnter: function(args) {
    //     console.log('called from:\n' +
    //     Thread.backtrace(this.context, Backtracer.ACCURATE)
    //     .map(DebugSymbol.fromAddress).join('\n') + '\n');
    //       }
    // });

    // details.address is a NativePointer
    switch (details.address.toInt32()) {

      case 0x572a58:
        // occurs after kai engine started.
        // cmp qword [rbx + 0x40], 0
        console.log('Known access-violation 0x572a58');
        // if (! Memory.protect(details.memory.address, 64, 'r--'))
        //   console.log("Unable to fix memory at : " + details.memory.address);
        // else console.log("Fixed memory at : " + details.memory.address);
        bcontinue = true;
        // console.log(JSON.stringify(Process.findModuleByAddress(details.address)));
        // console.log(details.address.sub(moduleBase));
        break;
      case 0x573667:
        // Occurs when access to an arena with active server.
        // this make the webserver trashed ? so we exit.
        console.log('Known access-violation 0x573667');
        break;
      case 0x651030:
      case 0x651130:
        bcontinue = true;
        console.log('Known access-violation' + details.address );
        break;
      default:
        console.log(JSON.stringify(details));
        console.log(details.address.sub(moduleBase));
    }
    Thread.sleep(1);

  } catch (e) { console.error(e); } // send (2);
  return bcontinue;
});

// fcn.00572a40 (int64_t arg1, int64_t arg2, int64_t arg3, int64_t arg4);
Interceptor.attach(ptr("0x00572a40"), {
  onEnter: function(args) {
    console.log('fcn.00572a40' + ',' + args[0] +',' +  args[1] +',' +  args[2] + ',' + args[3]   );
    // error occurs when args[0] == 0,
    if (args[0] != 0) { console.log('fcn.00572a40 arg0 : ' + hexdump(args[0].add(0x40))); }
    // Known values : 0x7f1fd8005a60


    // Memory.protect(ptr("0x7f5fa800355f"), 4096, 'r--');
    // console.log('fcn.00572a40 arg0 : ' + hexdump(ptr("0x7f5fa800355f")));

    // console.log('fcn.00572a40 called from:\n' +
    // Thread.backtrace(this.context, Backtracer.ACCURATE)
    // .map(DebugSymbol.fromAddress).join('\n') + '\n');
      }



});

// TODO : write example how deal with software open/close stuff in /nix/store
// using Interceptor.replace()
// getExportByName('libc.so',...) doesnt work ?
Interceptor.attach(Module.findExportByName(null, 'open'), {
  onEnter: function(args) {
    this.flag = false;
    // var filename = Memory.readCString(ptr(args[0]));
    var filename = args[0].readCString();
    // var filename = args[0].readPointer().readCString();
    console.log('filename =', filename);
    if (filename.endsWith("kaiengine.conf")) {
      this.flag = true;
      var backtrace = Thread.backtrace(this.context, Backtracer.ACCURATE).map(DebugSymbol.fromAddress).join("\n\t");
      console.log("file name [ " + Memory.readCString(ptr(args[0])) + " ]\nBacktrace:" + backtrace);
    }
  },
  onLeave: function(retval) {
    if (this.flag) // passed from onEnter
      console.warn("\nretval: " + retval);
  }
});


// download configuration
// Interceptor.attach(ptr("0x004b09b0"), {
//   onLeave: function(retval) {
//
//       // get the xml configuration
//       var m = Process.enumerateThreads()[0];
//       var pattern = '3c 3f 78 6d 6c'; // <?xml
// console.log(JSON.stringify(m));
//       Memory.scan(m.base, m.size, pattern, {
//         onMatch: function (address, size) {
//           console.log('Memory.scan() found match at', address,
//               'with size', size);
//
//           // Optionally stop scanning early:
//           return 'stop';
//         },
//         onComplete: function () {
//           console.log('Memory.scan() complete');
//         }
//     });
// }});