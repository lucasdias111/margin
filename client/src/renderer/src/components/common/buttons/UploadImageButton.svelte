<script lang="ts">
  interface Props {
    onFileChange: (file: File) => Promise<void>
    onPreviewUrlChange: (url: string) => Promise<void>
  }
  let { onFileChange, onPreviewUrlChange }: Props = $props()
  let file: File = $state<File>(null)

  function handleFileChange(event: Event): void {
    const input = event.target as HTMLInputElement
    file = input.files?.[0]

    if (file) {
      onFileChange(file)

      const reader = new FileReader()
      reader.onload = (e) => {
        onPreviewUrlChange(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }
</script>

<input
  id="profilePicture"
  type="file"
  name="profilePicture"
  accept="image/*"
  onchange={handleFileChange}
  hidden
  placeholder="Profile Picture (Optional)"
/>

<label for="profilePicture" class="fileUpload"> Upload </label>

<style>
  .fileUpload {
    height: 40px;
    border-radius: 10px;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    border: 1px solid #4e4d4d;
    display: flex;
    align-items: center;
    padding: 0 12px;
    font-size: 14px;
    cursor: pointer;
    background-color: rgb(255, 255, 255);
    color: #da610b;
  }
</style>
