<script lang="ts">
  interface Props {
    onFileChange: (file: File) => Promise<void>
    onPreviewUrlChange: (url: string) => Promise<void>
    label?: string
    width?: number
    height?: number
  }
  let { onFileChange, onPreviewUrlChange, label }: Props = $props()
  let file: File = $state<File>(null)

  async function handleFileChange(event: Event): Promise<void> {
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

<label for="profilePicture" class="fileUpload"> {label ?? 'Upload'} </label>

<style>
  .fileUpload {
    height: 40px;
    border-radius: 10px;
    font-family: inherit;
    border: 1px solid rgba(78, 77, 77, 0.46);
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 0 12px;
    font-size: 14px;
    cursor: pointer;
    background-color: rgb(255, 255, 255);
    color: #f47e3a;
  }
</style>
