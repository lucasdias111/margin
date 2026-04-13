<script lang="ts">
  import Button from './Button.svelte'

  interface Props {
    onFileChange: (file: File) => Promise<void>
    onPreviewUrlChange: (url: string) => Promise<void>
    label?: string
  }
  let { onFileChange, onPreviewUrlChange, label }: Props = $props()
  let inputRef: HTMLInputElement

  async function handleFileChange(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
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

<input bind:this={inputRef} type="file" accept="image/*" onchange={handleFileChange} hidden />

<Button
  text={label ?? 'Upload'}
  buttonType="secondary"
  size="small"
  onClick={() => inputRef.click()}
/>

<input
  id="profilePicture"
  type="file"
  name="profilePicture"
  accept="image/*"
  onchange={handleFileChange}
  hidden
  placeholder="Profile Picture (Optional)"
/>

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
