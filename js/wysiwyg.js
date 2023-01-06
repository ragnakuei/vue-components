const wysiwyg = {
    template: `
<div class="wysiwyg" >
    <div class="toolbar">

        <button class="item undo" v-on:click="doc_execCommand('undo')"></button>
        <button class="item redo" v-on:click="doc_execCommand('redo')"></button>
        
        <div class="item delimiter"></div>

        <button class="item underline" v-on:click="doc_execCommand('underline')"></button>
        <button class="item italic" v-on:click="doc_execCommand('italic')"></button>
        <button class="item bold" v-on:click="doc_execCommand('bold')"></button>

        <div class="item delimiter"></div>

        <button class="item link" v-on:click="insert_link()"></button>

        <input type="file" accept="image/*" style="display: none;" id="insert_image" v-on:change="insert_image($event.target)">
        <label class="item file-image" for="insert_image"></label>

        <button class="item tint" v-on:click="changeColor()"></button>
        <button class="item strikethrough" v-on:click="doc_execCommand('strikeThrough')"></button>
        <button class="item trash" v-on:click="doc_execCommand('delete')"></button>

        <button class="item scribd" v-on:click="doc_execCommand('selectAll')"></button>
        <button class="item clone" v-on:click="copy()"></button>

        <!-- Jutify -->

        <button class="item align-center" v-on:click="doc_execCommand('justifyCenter')"></button>
        <button class="item align-left" v-on:click="doc_execCommand('justifyLeft')"></button>
        <button class="item align-right" v-on:click="doc_execCommand('justifyRight')"></button>
    </div>
    <hr />
    <div class="editor" contenteditable v-html="domValue">
    </div>
</div>
          `,
    props: {
        modelValue: String,
    },
    setup(props, { emit }) {
    
        const domField = ref(props.modelValue);
        const domValue = computed({
            get: () => {
              return domField.value;
            },
            set: (v) => {
              domField.value = v;
              emit("update:modelValue", v);
            },
          });

      const doc_execCommand = function(command, showUI, value) {
        document.execCommand(command, showUI, value);
      }

      const insert_link = function() {
        const url = prompt("Enter the link here: ", "http:\/\/");
        if(url) {
            doc_execCommand("createLink", false, url);
        }
      }
  
      const insert_image = function(target) {
        const file = target.files[0];
        const reader = new FileReader();
      
        let dataURI;
      
        reader.addEventListener(
          "load",
          function() {
            dataURI = reader.result;  // image base64 string

            if(!doc_execCommand("InsertImage", false, dataURI)) {
                console.log("InsertImage 失敗，改用 insert image tag");
    
                // 產生 img tag string
                const img = `<img src="${dataURI}" />`;
                domValue.value += img;
            }
          },
          false
        );
      
        if (file) {
          reader.readAsDataURL(file);
        }
      }

      onMounted(() => {});
  
      return {
        domValue,
        doc_execCommand,
        insert_link,
        insert_image,
      };
    },
  };
  